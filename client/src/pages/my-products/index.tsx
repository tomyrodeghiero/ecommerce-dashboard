import "react-toastify/dist/ReactToastify.css";

// ** Styled Component Import
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

const StyledCard = styled(Card)(({ theme, isSelected }: any) => ({
  // Asegúrate de obtener la prop aquí
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1),
  position: "relative",
  backgroundColor: "#ffffff",
  transition: "transform 0.3s ease-in-out",
  boxShadow: isSelected ? "0px 0px 10px #ffca0a" : "0px 0px 10px #F4F5F7",
  "&:hover": {
    transform: "scale(1.025)",
    cursor: "pointer",
  },
}));

const MyProductsPage = () => {
  const router = useRouter();
  const theme = useTheme();

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

  const fetchProducts = async () => {
    setLoadingProducts(true);

    const response = await fetch("/api/products?page=1&limit=100");
    if (response.ok) {
      const data = await response.json();
      setProducts(data.products);
    }

    setLoadingProducts(false);
  };

  const handleDelete = async (productId: string) => {
    const response = await fetch(`/api/delete-product/${productId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      fetchProducts();

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
    fetchProducts();
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
      fetchProducts();
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
    top: theme.spacing(2), // o puedes usar un valor fijo como '10px'
    right: theme.spacing(5), // o puedes usar un valor fijo como '10px'
    zIndex: 9999, // asegúrate de que esté sobre otros elementos
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    backgroundColor: "#f5f5fc", // un color de fondo claro, cambia según tu diseño
    borderRadius: "8px", // bordes redondeados, ajusta a tu preferencia
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)", // sombra sutil, modifica como necesites
    padding: "1rem", // espacio interior, ajusta según tu preferencia
    width: "auto", // o un ancho específico si lo necesitas
    maxWidth: "calc(100% - 1rem)", // para asegurar que no exceda el ancho de la ventana
    boxSizing: "border-box", // para incluir el padding en el ancho definido
    // Puedes agregar una transición para animar el fondo, bordes, etc.
    transition: "all 0.3s ease",
  }));

  const handleBlur = () => {
    if (!increasePercentage.endsWith("%")) {
      setIncreasePercentage(increasePercentage + "%");
    }
  };

  return (
    <ApexChartWrapper>
      <div className="flex justify-end items-center gap-4 p-4">
        {selectedProducts.length > 0 && (
          <>
            <input
              type="text"
              value={increasePercentage}
              onChange={(e) => setIncreasePercentage(e.target.value)}
              placeholder="% de aumento"
              onBlur={handleBlur}
              className="border-2 text-center outline-1 outline-slate-400 font-semibold border-gray-300 p-2 rounded-md mb-2" // Añadido mb-2 para margen entre el input y el botón
            />
            <Button onClick={handleIncreasePrices} variant="contained">
              Aumentar precios
            </Button>
          </>
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
                className="rounded-lg p-4 relative bg-white transition-transform duration-200 ease-in-out transform"
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
                  <p
                    className={`${
                      getMinPrice(product) === 0
                        ? "text-yellow-700"
                        : "text-yellow-800"
                    } mt-1 font-semibold`}
                  >
                    {getMinPrice(product) === 0
                      ? "⚠️ Sin Precio"
                      : `$ ${getMinPrice(product)}`}
                  </p>
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
