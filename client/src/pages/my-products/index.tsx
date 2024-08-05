import "react-toastify/dist/ReactToastify.css";

// Styled Component Import
import ApexChartWrapper from "src/@core/styles/libs/react-apexcharts";

import { ToastContainer, toast } from "react-toastify";
import { formatPriceARS } from "src/utils/functions";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { OPTIONS_ICON } from "src/utils/images/icons";
import Card from "@mui/material/Card";

import { styled, useTheme } from "@mui/material/styles";
import { Button } from "@mui/material";

// Styled component for the triangle shaped background image
const TriangleImg = styled("img")({
  right: 0,
  bottom: 0,
  height: 70,
  position: "absolute",
});

const StyledCard = styled(Card)(({ theme, isSelected }) => ({
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1),
  position: "relative",
  backgroundColor: "#ffffff",
  transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out, border 0.3s ease-in-out",
  "&:hover": {
    transform: "scale(1.025)",
    cursor: "pointer",
  },
  border: isSelected ? "2px solid #E8B600" : "2px solid transparent",
  boxShadow: isSelected ? "0 0 10px rgba(232, 182, 0, 0.5)" : "none",
}));

const MyProductsPage = () => {
  const router = useRouter();
  const theme = useTheme();
  const currentPath = router.pathname;

  const [userType, setUserType] = useState("");
  useEffect(() => {
    const storedUserType: any = localStorage.getItem("userType");
    setUserType(storedUserType);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAuthenticated = localStorage.getItem("authenticated");
      const userType = localStorage.getItem("userType");

      if (isAuthenticated !== "true") {
        router.push("/pages/login");
      } else {
        fetchProducts(userType);
      }
    }
  }, [router]);

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const handleProductClick = (productId: string) => {
    setSelectedProducts((prevSelectedProducts) =>
      prevSelectedProducts.includes(productId)
        ? prevSelectedProducts.filter((id) => id !== productId)
        : [...prevSelectedProducts, productId]
    );
  };

  const imageSrc =
    theme.palette.mode === "light" ? "triangle-light.png" : "triangle-dark.png";

  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);

  const dropdownRef = useRef<any>(null);

  const fetchProducts = async (userType: any) => {
    setLoadingProducts(true);

    const response = await fetch("/api/products?page=1&limit=100");
    if (response.ok) {
      const data = await response.json();
      let filteredProducts;

      if (userType === "joyasboulevard") {
        filteredProducts = data.products.filter(
          (product: any) => product.username === "joyasboulevard"
        );
      }
      else if (userType === "dpastel") {
        filteredProducts = data.products.filter(
          (product: any) => product.username === "dpastel"
        );
      } else if (userType === "sophilum") {
        filteredProducts = data.products.filter(
          (product: any) => product.username === "sophilum" || !product.username
        );
      } else {
        filteredProducts = [];
      }

      setProducts(filteredProducts);
    }

    setLoadingProducts(false);
  };

  const handleDelete = async (productId: string) => {
    const userType = localStorage.getItem("userType");
    const response = await fetch(`/api/delete-product/${productId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      fetchProducts(userType);

      toast.success("1 producto ha sido eliminado.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } else {
      alert("Failed to delete product");
    }
  };

  const handleClickOutside = (event: any) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setSelectedProduct("");
    }
  };

  const handleEsc = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setSelectedProduct("");
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  useEffect(() => {
    const userType = localStorage.getItem("userType");
    fetchProducts(userType);
  }, []);

  const handleEdit = (productId: string) => {
    router.push(`/edit-product/${productId}`);
  };

  const getMinPrice = (product: any) => {
    // Verifica si el producto tiene medidas y precios válidos
    if (
      product.measurements &&
      product.measurements.length > 0 &&
      product.measurements.some(
        (measure: any) => typeof measure.price === "number"
      )
    ) {
      // Filtra y mapea para obtener solo precios válidos
      const prices = product.measurements
        .map((measure: any) => measure.price)
        .filter((price: number) => typeof price === "number" && !isNaN(price));

      // Encuentra el precio mínimo
      const minPrice = Math.min(...prices);

      // Maneja el caso de precio igual a 0
      if (minPrice === 0) {
        return 0;
      }

      // Formatea y devuelve el precio mínimo
      return formatPriceARS(minPrice);
    }

    // Retorna un mensaje si no se puede determinar el precio
    return 0;
  };

  const [increasePercentage, setIncreasePercentage] = useState("");

  const handleIncreasePrices = async () => {
    if (selectedProducts.length === 0 || !increasePercentage) {
      toast.error("Selecciona productos y define un porcentaje de aumento.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }

    const response = await fetch("/api/products/price-increase", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productIds: selectedProducts,
        increasePercentage: parseFloat(increasePercentage),
      }),
    });

    const userType = localStorage.getItem("userType");
    if (response.ok) {
      toast.success("Los precios se han actualizado correctamente.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      // Recarga los productos para obtener los precios actualizados
      fetchProducts(userType);
    } else {
      toast.error("Hubo un error al actualizar los precios.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const IncreasePriceSection = styled("div")(({ theme }) => ({
    position: "fixed",
    top: theme.spacing(2),
    right: theme.spacing(5),
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    backgroundColor: "#f5f5fc",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
    padding: "1rem",
    width: "auto",
    maxWidth: "calc(100% - 1rem)",
    boxSizing: "border-box",
    transition: "all 0.3s ease",
  }));

  const handleBlur = () => {
    if (!increasePercentage.endsWith("%")) {
      setIncreasePercentage(increasePercentage + "%");
    }
  };

  // Function to select all products
  const selectAllProducts = () => {
    const allProductIds = products.map((product) => product._id);
    setSelectedProducts(allProductIds);
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const [isOpen, setIsOpen] = useState(false);

  const menuOptions = [
    { title: "Mis Productos", path: "/my-products" },
    { title: "Añadir Producto", path: "/add-product" },
    { title: "Paleta de Colores", path: "/my-colors" },
  ];

  const handleNavigation = (path: any) => {
    router.push(path);
    setIsOpen(false);
  };



  return (
    <ApexChartWrapper>
      <div className="relative lg:hidden">
        <div className="mt-2 w-full bg-white shadow rounded z-20">
          {menuOptions.map((option, index) => (
            <div key={index} className="flex flex-col">
              <button
                onClick={() => handleNavigation(option.path)}
                className={`font-medium py-2 px-4 hover:bg-gray-100 w-full text-left ${currentPath === option.path ? "bg-blue-100 text-black" : "text-gray-900"}`}
              >
                - {option.title}
              </button>
              {index < menuOptions.length - 1 && (
                <hr className="border-t mx-2 border-gray-200" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end items-center gap-4 p-4">
        {selectedProducts.length > 0 && (
          <>
            <input
              type="text"
              value={increasePercentage}
              onChange={(e) => setIncreasePercentage(e.target.value)}
              placeholder="% de aumento"
              onBlur={handleBlur}
              className="border-2 text-center outline-1 outline-slate-400 font-semibold border-gray-300 p-2 rounded-md"
            />
            <Button
              onClick={handleIncreasePrices}
              variant="contained"
              sx={{
                backgroundColor: "#E8B600",
                boxShadow: "0 1px 14px 1px #212121",
                "&:hover": {
                  boxShadow: "0 1px 14px 1px #212121",
                },
              }}
            >
              Aumentar precios
            </Button>
          </>
        )}
        {selectedProducts.length !== products.length && (
          <Button
            onClick={selectAllProducts}
            variant="contained"
            sx={{
              backgroundColor: "#2a3243",
              boxShadow: "0 1px 14px 1px #2a3243",
              "&:hover": {
                boxShadow: "none",
                backgroundColor: "#2a3243",
              },
              marginRight: "10px",
            }}
          >
            Seleccionar Todos
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 lg:py-8">
        {loadingProducts
          ? Array.from({ length: 8 }).map((_, idx) => (
            <StyledCard
              key={idx}
              className="rounded-lg p-4 relative bg-white transition-transform duration-200 ease-in-out transform"
            >
              <div className="w-48 h-48 mt-5 mx-auto bg-gray-200 rounded-full"></div>
              <div className="mt-5 flex flex-col items-center">
                <div className="bg-gray-200 w-2/3 h-4 my-2 rounded"></div>
                <div className="bg-gray-200 w-1/2 h-4 my-2 rounded"></div>
              </div>
            </StyledCard>
          ))
          : products.map((product) => (
            <StyledCard
              key={product._id}
              onClick={() => handleProductClick(product._id)}
              isSelected={selectedProducts.includes(product._id)}
            >
              <img
                src={OPTIONS_ICON}
                alt="Options"
                className="w-4 object-cover cursor-pointer absolute top-2 right-2"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedProduct(product._id);
                }}
              />

              {selectedProduct === product._id && (
                <div
                  ref={dropdownRef}
                  className="absolute right-0 mt-2 w-28 bg-white rounded-md overflow-hidden z-10"
                >
                  <div
                    onClick={(event) => {
                      event.stopPropagation();
                      handleEdit(product._id);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 cursor-pointer"
                  >
                    Editar
                  </div>
                  <div
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(product._id);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 cursor-pointer"
                  >
                    Eliminar
                  </div>
                </div>
              )}

              <img
                src={product.mainImageUrl}
                alt={product.name}
                className="w-48 h-48 mt-5 mx-auto rounded-full object-cover"
              />

              <div className="mt-5 flex flex-col items-center">
                <h3 className="font-bold text-[1.1rem] text-center">
                  {product.name}
                </h3>
                {(userType === "sophilum" || userType === "dpastel") && (
                  <p
                    className={`${getMinPrice(product) === 0
                      ? "text-white bg-[#D5A701] px-2 py-1 rounded-lg"
                      : "text-yellow-800"
                      } mt-1 font-semibold`}
                  >
                    {getMinPrice(product) === 0
                      ? "⚠️ Sin Precio"
                      : `$ ${getMinPrice(product)}`}
                  </p>
                )}

                {userType === "joyasboulevard" && (
                  <p className={`text-yellow-800 mt-1 font-semibold`}>
                    $ {formatPriceARS(product.price)}
                  </p>
                )}
              </div>
              <TriangleImg
                alt="triangle background"
                src={`/images/misc/${imageSrc}`}
              />
            </StyledCard>
          ))}

        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </ApexChartWrapper>
  );
};

export default MyProductsPage;
