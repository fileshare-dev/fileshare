const {graphqlHTTP} = require('express-graphql');
const Sequelize = require('sequelize')
const graphql = require('graphql');
const graphqlUUID = require('graphql-type-uuid');
const graphqlDate = require('graphql-date-scalars');
const fs = require('fs');
const otplib = require('otplib');
const AdmZip = require('adm-zip');
const models = require('../../models/index.js');


class GraphqlError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  };
}

const typesMapping = {
  [Sequelize.STRING]: "String",
  [Sequelize.BOOLEAN]: "Boolean",
  [Sequelize.INTEGER]: "Int",
  [Sequelize.UUID]: "UUID",
  [Sequelize.DATE]: "Date",

  [JSON.stringify(["admin", "user"])]: "RoleEnum"
}

const scaffoldModel = function (model, exclude = [], parentClass = null) {
  let tpl = parentClass !== null ?
    `type ${model.name} implements ${parentClass} { `
    : `type ${model.name} { `;
  for (const [name, attr] of Object.entries(model.getAttributes())) {
    if (exclude.includes(name)) continue;

    if (attr.type.key === "ENUM") {
      tpl += `${name}:${typesMapping[JSON.stringify(attr.type.values)]}`;
    } else {
      tpl += `${name}:${typesMapping[attr.type.key]}`;
    }
    if (attr.allowNull !== true)
      tpl += '!'
    tpl += ', ';
  }
  return tpl + '}'
}

// Construct a schema, using GraphQL schema language
const schemaSource = `
  scalar UUID
  scalar Date
  enum RoleEnum {
    admin
    user
  }
  
  type Query {
    me: MyUser!,
    user(id: UUID!): IUser
    share(id: UUID!): Share,
    fileShare(shareLink: String!, fileId: UUID!): FileShare,
    downloadFile(shareId: UUID!, fileId: UUID!): FileShareAttachment,
    downloadShare(id: UUID!): ShareAttachment
  },
  
  interface IUser {
    id: UUID!,
  }
  
  type PublicUser implements IUser {
    id: UUID!,
    username: String!,
    role: RoleEnum!
    verified: Boolean!
    created_at: Date!
  },
  
  ${scaffoldModel(models.File)},
  ${scaffoldModel(models.User, ["password"], 'IUser')},
  ${scaffoldModel(models.Share)},
  
  type Mutation {
    giveAccess(id: UUID!, otp: String!, username: String!): GiveAccessResult
    toggleShareVisibility(id: UUID!): Share
  }
  
  extend type Share {
    owner: UUID!
    allowedUsers: [IUser!],
    files: [UUID!]
  }
  
  type FileShare {
    file: File!,
    share: Share!
  }
  
  type GiveAccessResult {
    success: Boolean!,
    message: String!,
    owner: IUser!,
    share: Share!,
  }
  
  type FileShareAttachment {
    metadata: FileShare!,
    content: String!
  }
  
  type ShareAttachment {
    share: Share!
    zipContent: String!
  }
  
  type MyUser {
    me: IUser!
    myShares: [Share!]
    myFiles: [UUID!]
    accessibleShares: [Share!]
  }
  
`;

const schema = graphql.buildSchema(schemaSource);

//assign missing scalars
Object.assign(schema._typeMap.UUID, graphqlUUID);
Object.assign(schema._typeMap.Date, graphqlDate.DateTimeScalar);

const lookupShare = async share => {
  let acls = (await share.getAcl()).map(user => {
    return {
      ...user.dataValues,
      __typename: 'PublicUser'
    }
  });

  return {
    ...share.dataValues,

    allowedUsers: acls,
    files: (await share.getFiles())
      .map(x => x.id),
    owner: share.UserId
  }
};

// The root provides a resolver function for each API endpoint
const root = {
  me: async (args, req) => {
    let files = (await models.File.findAll({
      where: {
        userId: req.user.id
      }
    })).map(x => x.id);

    let user = await models.User.findByPk(req.user.id);

    let accessibleShares = await Promise.all((await user.getAccessibleShare())
      .map(lookupShare));

    let shares = await Promise.all((await models.Share.findAll({
      where: {
        userId: req.user.id
      }
    })).map(lookupShare));

    return {
      me: user,
      myFiles: files,
      myShares: shares,
      accessibleShares: accessibleShares
    };
  },

  user: async (args, req) => {
    let user = await models.User.findByPk(args.id);
    if (user === null)
      throw new GraphqlError(`User "${args.id}" not found.`, 404)

    user.__typename = 'PublicUser';
    return user;
  },

  share: async (args, req) => {
    let share = await models.Share.findByPk(args.id);
    if (share === null)
      throw new GraphqlError(`Access forbidden.`, 403)

    let acls = await share.getAcl();
    let isAllowed = share.UserId === req.user.id
      || acls.find(user => user.id === req.user.id) !== undefined;
    if (!isAllowed)
      throw new GraphqlError(`Access forbidden.`, 403)

    acls.forEach(user => user.__typename = 'PublicUser');

    return {
      ...share.dataValues,

      allowedUsers: acls,
      files: (await share.getFiles())
        .map(x => x.id),
      owner: share.UserId
    };
  },

  fileShare: async (args, req) => {
    let file = await models.File.findByPk(args.fileId);
    if (file === null)
      throw new GraphqlError(`File not found.`, 404)
    let shareLink = args.shareLink;
    let share = await models.Share.findOne({
      where: {
        link: shareLink
      }
    });
    if (share === null)
      throw new GraphqlError(`Share not found.`, 404)

    let belongsTo = (await share.getFiles())
      .find(file => file.id === args.fileId) !== undefined
    if(!belongsTo) {
      throw new GraphqlError(`File ${args.fileId} does not belong to share ${share.id}.`, 404)
    }

    let acls = await share.getAcl();
    let isAllowed = share.UserId === req.user.id
      || acls.find(user => user.id === req.user.id) !== undefined;
    if (!isAllowed)
      throw new GraphqlError(`Access forbidden to share ${share.id}.`, 403)

    acls.forEach(user => user.__typename = 'PublicUser');
    return {
      file: file,
      share: {
        ...share.dataValues,

        allowedUsers: acls,
        files: (await share.getFiles())
          .map(x => x.id),
        owner: share.UserId
      }
    }
  },

  downloadShare: async (args, req) => {
    let share = await models.Share.findByPk(args.id);
    if (share === null)
      throw new GraphqlError(`Access forbidden.`, 403)

    let acls = await share.getAcl();
    let isAllowed = share.UserId === req.user.id
      || acls.find(user => user.id === req.user.id) !== undefined;
    if (!isAllowed)
      throw new GraphqlError(`Access forbidden.`, 403)

    acls.forEach(user => user.__typename = 'PublicUser');

    let archive = new AdmZip();
    (await share.getFiles()).forEach((x) => {
      archive.addFile(x.name, fs.readFileSync(x.path), x.path);
    });
    return {
      share: {
        ...share.dataValues,

        allowedUsers: acls,
        files: (await share.getFiles())
          .map(x => x.id),
        owner: share.UserId
      },
      zipContent: archive.toBuffer().toString('base64')
    }
  },

  downloadFile: async (args, req) => {
    let share = await models.Share.findByPk(args.shareId);
    if (share === null)
      throw new GraphqlError(`Access forbidden.`, 403)

    let acls = await share.getAcl();
    let isAllowed = share.UserId === req.user.id
      || acls.find(user => user.id === req.user.id) !== undefined;
    if (!isAllowed)
      throw new GraphqlError(`Access forbidden.`, 403)

    let file = await models.File.findByPk(args.fileId);
    if (file === null)
      throw new GraphqlError(`File not found.`, 404)

    let fileContent = await fs.readFileSync(file.path);

    acls.forEach(user => user.__typename = 'PublicUser');
    return {
      metadata: {
        file: file,
        share: {
          ...share.dataValues,

          allowedUsers: acls,
          files: (await share.getFiles())
            .map(x => x.id),
          owner: share.UserId
        }
      },
      content: fileContent.toString('base64')
    }
  },

  giveAccess: async (args, req) => {
    let share = await models.Share.findByPk(args.id);
    if (share === null)
      throw new GraphqlError(`Access forbidden.`, 403)

    let shareUser = await models.User.findOne({
      where: {
        username: args.username
      }
    });

    if (shareUser === null)
      throw new GraphqlError(`User not found.`, 404)

    let isAllowed = shareUser.id === req.user.id;
    if (!isAllowed)
      throw new GraphqlError(`Access forbidden.`, 403)

    let isOtpValid = otplib.authenticator.check(args.otp,
      (await share.getUser()).mfa_secret);

    if (!isOtpValid) {
      return {
        owner: share.getUser(),
        share: lookupShare(share),
        success: false,
        message: "OTP invalid"
      }
    } else {
      await share.addAcl(shareUser);
      await share.save();
      return {
        owner: share.getUser(),
        share: lookupShare(share),
        success: true,
        message: "OK"
      }
    }
  },

  toggleShareVisibility: async (args, req) => {
    let share = await models.Share.findByPk(args.shareId);
    if (share === null)
      throw new GraphqlError(`Access forbidden.`, 403)

    let isAllowed = share.UserId === req.user.id;
    if (!isAllowed)
      throw new GraphqlError(`Access forbidden.`, 403)

    let validUntil = null;
    if (!share.isPublic) {
      let date = new Date();
      validUntil = date.setDate(date.getDate() + 7);
    }
    await share.update({isPublic: !share.isPublic, validUntil: validUntil});
    return await lookupShare(share);
  },
};

module.exports = graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: false,
  typeResolver: function (value, context, info, abstractType) {
    if (value === null) return null;
    return value.hasOwnProperty('__typename')
      ? value.__typename
      : (value.constructor.hasOwnProperty('name')
          ? value.constructor.name
          : null
      );
  },
  validationRules: [graphql.NoSchemaIntrospectionCustomRule],
  customFormatErrorFn: (error) => {
    return {
      message: error.message.split(' Did you mean ')[0],
      statusCode: error.originalError !== undefined
      && error.originalError.hasOwnProperty('statusCode')
        ? error.originalError.statusCode : 500
    }
  }
});
