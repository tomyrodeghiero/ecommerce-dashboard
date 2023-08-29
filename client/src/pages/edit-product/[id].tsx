import "react-toastify/dist/ReactToastify.css";

import React, { useEffect, useRef, useState } from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import dynamic from "next/dynamic";
import { toast, ToastContainer } from "react-toastify";
import { IMAGE, STARS_COPILOT_ICON } from "src/utils/images/icons";
import LoadingSpinner from "src/@core/components/loading-spinner";
import Button from "@mui/material/Button";
import { CATEGORIES } from "src/utils/constants";
import { useRouter } from "next/router";

const formats = [
  "header",
  "font",
  "size",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "bullet",
  "indent",
  "link",
  "image",
  "color",
];

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const EditProductPage = () => {
  const router = useRouter();
  const { id } = router.query; // Obtiene el ID desde la URL.

  const [productName, setProductName] = useState<string>("");
  const [productPrice, setProductPrice] = useState<
    string | number | readonly string[] | any | undefined
  >(undefined);

  const quillRef = useRef(null);

  useEffect(() => {
    console.log(quillRef.current);
  }, [quillRef]);

  const [activeTab, setActiveTab] = useState<string>("briefDescription");
  const [productDescription, setProductDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mainImageUrl, setMainImageUrl] = useState<File | null>(null);
  const [secondaryImageUrls, setSecondaryImageUrls] = useState<File[]>([]);

  const [productBriefDescription, setProductBriefDescription] = useState("");
  const [additionalInformation, setAdditionalInformation] = useState("");
  const [category, setCategory] = useState("");
  const [isOnSale, setIsOnSale] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [productStock, setProductStock] = useState(0);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (id) {
        const response = await fetch(`/api/product/${id}`);
        if (response.ok) {
          const product = await response.json();
          // Asigna los datos del producto a los estados respectivos.
          setProductName(product.name);
          setProductPrice(product.price);
          setProductDescription(product.description);
          setProductBriefDescription(product.briefDescription);
          setCategory(product.category);
          setMainImageUrl(product.mainImageUrl);
          setSecondaryImageUrls(product.secondaryImageUrls);
        }
      }
    };

    fetchProductDetails();
  }, [id]); // El useEffect se ejecutará cada vez que 'id' cambie.

  const handleSubmitUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación de campos
    if (!productName) {
      return showErrorMessage("El nombre del producto está vacío");
    }

    if (!productPrice) {
      return showErrorMessage("El precio del producto no está especificado");
    }

    if (!productBriefDescription) {
      return showErrorMessage("La descripción breve del producto está vacía");
    }

    if (!productDescription) {
      return showErrorMessage("La descripción del producto está vacía");
    }

    if (!category) {
      return showErrorMessage("La categoría del producto no está especificada");
    }

    if (!mainImageUrl) {
      return showErrorMessage(
        "La URL principal de la imagen del producto está vacía"
      );
    }

    const formData = new FormData();
    formData.append("name", productName);
    formData.append("price", productPrice.toString());
    formData.append("briefDescription", productBriefDescription);
    formData.append("description", productDescription);
    formData.append("additionalInformation", additionalInformation);
    formData.append("category", category);
    formData.append("isOnSale", JSON.stringify(isOnSale));
    formData.append("discount", discount.toString());
    formData.append("stock", productStock.toString());

    if (mainImageUrl) {
      formData.append("images", mainImageUrl, mainImageUrl.name);
    }

    secondaryImageUrls.forEach((image: any, index: number) => {
      formData.append("images", image, `secondary-image-${index}`);
    });

    const response = await fetch(`/api/edit-product/${id}`, {
      method: "PUT",
      body: formData,
    });

    if (response.ok) {
      setProductName("");
      setProductPrice(0);
      setProductDescription("");
      setProductBriefDescription("");
      setCategory(""); // Limpia la categoría
      setMainImageUrl(null); // Limpia la imagen principal
      setSecondaryImageUrls([]); // Limpia las imágenes de vista previa

      toast.success("El producto ha sido actualizado correctamente.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } else {
      alert("Failed to add product");
    }
  };

  // Mostrar un toast de error con el mensaje específico
  function showErrorMessage(message: string) {
    toast.error(message, {
      position: "top-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
  }

  const handleSecondaryImagesChange = (e: any, index: number) => {
    let newPreviewImages = [...secondaryImageUrls];
    newPreviewImages[index] = e.target.files[0];
    setSecondaryImageUrls(newPreviewImages);
  };

  const generateProductDescription = async (
    product: string,
    additional: boolean = false
  ) => {
    setIsLoading(true);
    const prompt = additional
      ? `Genera una descripción detallada para el producto ${product}, destacando todas sus características y beneficios.`
      : `Genera una breve introducción para el producto ${product}, resaltando sus puntos clave.`;

    try {
      const response = await fetch("/api/product-completion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: prompt }),
      });

      if (response.ok) {
        const responseData = await response.text();
        additional
          ? setProductBriefDescription(responseData)
          : setProductDescription(responseData);
      } else {
        throw new Error("Error with product completion API");
      }
    } catch (error) {
      console.error(error);
      alert("error");
    } finally {
      setIsLoading(false);
    }
  };

  const DescriptionEditor = React.useCallback(
    ({ value, onChange, generateDescription, loading }: any) => {
      return (
        <div className="relative">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <img
              className="absolute cursor-pointer right-2 top-2 text-white px-2 py-1"
              onClick={generateDescription}
              src={STARS_COPILOT_ICON}
              alt="Stars Copilot"
            />
          )}
          <ReactQuill
            ref={quillRef}
            value={value}
            onChange={onChange}
            formats={formats}
          />
        </div>
      );
    },
    []
  );

  return (
    <>
      <div className="lg:flex w-full gap-8">
        <div className="w-full lg:1/2">
          <p className="uppercase font-medium text-sm text-gray-500">
            💡 Iluminación Creativa
          </p>
          <input
            className="text-gray-800 bg-gray-200 mt-1 text-4xl w-full font-medium"
            value={productName}
            placeholder="Lámpara Moderna"
            onChange={(e) => setProductName(e.target.value)}
          />

          <div className="flex items-center mt-2 w-full">
            <span className="text-gray-700 text-2xl font-medium">$</span>
            <input
              className="text-gray-700 bg-gray-200 ml-2 w-2/5 text-2xl font-medium"
              value={productPrice}
              placeholder="1.200,00"
              type="number"
              onChange={(e: any) => setProductPrice(e.target.value)}
            />
          </div>

          <div className="mt-5">
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label" className="w-full">
                Categoría
              </InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={category}
                className="w-full"
                label="Categoría"
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((category: string, index: number) => (
                  <MenuItem key={index} className="w-full" value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <div className="border-b mt-2 lg:mt-1 mb-5 flex justify-between border-gray-300">
            <button
              className={`flex-grow flex justify-center py-3 items-center ${
                activeTab === "briefDescription"
                  ? "border-b-2 border-black"
                  : "text-gray-700"
              }`}
              onClick={() => setActiveTab("briefDescription")}
            >
              Introducción
            </button>
            <button
              className={`flex-grow flex justify-center py-3 items-center ${
                activeTab === "description"
                  ? "border-b-2 border-black"
                  : "text-gray-700"
              }`}
              onClick={() => setActiveTab("description")}
            >
              Descripción
            </button>
          </div>

          {activeTab === "description" && (
            <DescriptionEditor
              value={productDescription}
              onChange={setProductDescription}
              generateDescription={() =>
                generateProductDescription(productName)
              }
              loading={isLoading}
            />
          )}
          {activeTab === "briefDescription" && (
            <DescriptionEditor
              value={productBriefDescription}
              onChange={setProductBriefDescription}
              generateDescription={() =>
                generateProductDescription(productName, true)
              }
              loading={isLoading}
            />
          )}
        </div>

        <div className="w-full lg:1/2">
          <div className="hidden lg:flex justify-end w-full">
            <Button
              onClick={handleSubmitUpdateProduct}
              variant="contained"
              sx={{
                backgroundColor: "#6747E7",
                boxShadow: "0 1px 14px 1px #6747E7",
                "&:hover": {
                  boxShadow: "none",
                  backgroundColor: "#593AD8",
                },
              }}
            >
              Actualizar Producto
            </Button>
          </div>

          <label
            htmlFor="productImage"
            className="w-full h-96 rounded border-2 mt-5 border-dashed border-gray-300 flex items-center justify-center cursor-pointer"
          >
            {typeof window !== "undefined" &&
            mainImageUrl instanceof window.File ? (
              <img
                src={URL.createObjectURL(mainImageUrl)}
                alt="Product Main"
                className="w-full h-full object-cover rounded"
              />
            ) : mainImageUrl ? (
              <img
                src={mainImageUrl}
                alt="Product Main"
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <div>
                <img
                  src={IMAGE}
                  alt="Placeholder"
                  className="w-full h-32 object-cover rounded"
                />
              </div>
            )}
            <input
              id="productImage"
              type="file"
              onChange={(e: any) => {
                if (e.target.files.length > 0) {
                  setMainImageUrl(e.target.files[0]);
                }
              }}
              required
              className="hidden"
            />
          </label>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full mt-4">
            {secondaryImageUrls.map((previewImage, index: number) => (
              <label
                key={index}
                htmlFor={`secondaryImage-${index}`}
                className="w-40 h-40 object-cover border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer"
              >
                {typeof window !== "undefined" &&
                secondaryImageUrls.length > 0 &&
                secondaryImageUrls[0] instanceof window.File ? (
                  secondaryImageUrls.map((image, index) => (
                    <img
                      key={index}
                      src={URL.createObjectURL(image)}
                      alt={`Product Secondary ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                  ))
                ) : secondaryImageUrls && secondaryImageUrls.length > 0 ? (
                  secondaryImageUrls.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Product Secondary ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                  ))
                ) : (
                  <div>
                    <img
                      src={IMAGE}
                      alt="Placeholder"
                      className="w-full h-32 object-cover rounded"
                    />
                  </div>
                )}
                <input
                  id={`secondaryImage-${index}`}
                  type="file"
                  onChange={(e) => handleSecondaryImagesChange(e, index)}
                  className="hidden"
                />
              </label>
            ))}
            <label
              htmlFor={`secondaryImage-${secondaryImageUrls.length}`}
              className="w-40 h-40 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer"
            >
              <img
                src={IMAGE}
                alt="Product Main"
                className="w-auto h-14 object-cover rounded"
              />
              <input
                id={`secondaryImage-${secondaryImageUrls.length}`}
                type="file"
                onChange={(e) =>
                  handleSecondaryImagesChange(e, secondaryImageUrls.length)
                }
                className="hidden"
              />
            </label>
          </div>

          <div className="lg:hidden w-full mt-8">
            <Button
              onClick={handleSubmitUpdateProduct}
              variant="contained"
              sx={{
                backgroundColor: "#6747E7",
                boxShadow: "0 1px 14px 1px #6747E7",
                height: "3rem",
                width: "100%",
                "&:hover": {
                  boxShadow: "none",
                  backgroundColor: "#593AD8",
                },
              }}
            >
              Cargar Producto
            </Button>
          </div>
        </div>
      </div>

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
    </>
  );
};

export default EditProductPage;
