// component
import Iconify from '../../components/Iconify';

// ----------------------------------------------------------------------

const getIcon = (name) => <Iconify icon={name} width={22} height={22} />;

const navConfig = [
  {
    title: 'share',
    path: '/dashboard/share',
    icon: getIcon('eva:share-fill'),
  },
  {
    title: 'file',
    path: '/dashboard/file',
    icon: getIcon('eva:file-text-fill'),
  }
];

export default navConfig;
