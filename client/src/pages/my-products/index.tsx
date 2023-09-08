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

// Styled component for the triangle shaped background image
const TriangleImg = styled("img")({
  right: 0,
  bottom: 0,
  height: 70,
  position: "absolute",
});

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1),
  position: "relative",
  backgroundColor: "#ffffff",
  transition: "transform 0.3s ease-in-out",
  "&:hover": {
    transform: "scale(1.025)",
    cursor: "pointer",
  },
}));

const MyProductsPage = () => {
  const router = useRouter();
  const theme = useTheme();

  const imageSrc =
    theme.palette.mode === "light" ? "triangle-light.png" : "triangle-dark.png";

  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);

  const dropdownRef = useRef<any>(null);

  const fetchProducts = async () => {
    setLoadingProducts(true);

    const response = await fetch("/api/products");
    if (response.ok) {
      const data = await response.json();
      setProducts(data);
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

  return (
    <ApexChartWrapper>
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
                onClick={() => handleEdit(product._id)}
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
                  <p className="text-yellow-800 mt-1 font-semibold">
                    {formatPriceARS(product.price)}
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
