// ** Icon imports
import Login from "mdi-material-ui/Login";
import Table from "mdi-material-ui/Table";
import CubeOutline from "mdi-material-ui/CubeOutline";
import HomeOutline from "mdi-material-ui/HomeOutline";
import FormatLetterCase from "mdi-material-ui/FormatLetterCase";
import AccountCogOutline from "mdi-material-ui/AccountCogOutline";
import CreditCardOutline from "mdi-material-ui/CreditCardOutline";
import AccountPlusOutline from "mdi-material-ui/AccountPlusOutline";
import AlertCircleOutline from "mdi-material-ui/AlertCircleOutline";
import GoogleCirclesExtended from "mdi-material-ui/GoogleCirclesExtended";

// ** Type import
import { VerticalNavItemsType } from "src/@core/layouts/types";

const navigation = (): VerticalNavItemsType => {
  return [
    {
      sectionTitle: "Mi E-commerce",
    },
    {
      title: "Inicio",
      icon: HomeOutline,
      path: "/",
    },
    {
      title: "Mis Productos",
      icon: CubeOutline,
      path: "/my-products",
    },
    {
      title: "Añadir Producto",
      icon: AccountPlusOutline,
      path: "/add-product",
    },
    {
      sectionTitle: "Pages",
    },
    {
      title: "Inicio de Sesión",
      icon: Login,
      path: "/pages/login",
      openInNewTab: true,
    },
  ];
};

export default navigation;
