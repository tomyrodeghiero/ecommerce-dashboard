import "react-toastify/dist/ReactToastify.css";

import React, { useEffect, useRef, useState } from "react";
import {
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
} from "@mui/material";
import dynamic from "next/dynamic";
import { toast, ToastContainer } from "react-toastify";
import { IMAGE, STARS_COPILOT_ICON } from "src/utils/images/icons";
import LoadingSpinner from "src/@core/components/loading-spinner";
import Button from "@mui/material/Button";
import { CATEGORIES } from "src/utils/constants";
import { formatPriceARS, processPrice } from "src/utils/functions";

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

const AddProductPage = () => {
  const [productName, setProductName] = useState<string>("");
  const [productPrice, setProductPrice] = useState<number | null>(null);
  const [productPriceInput, setProductPriceInput] = useState<string>("");

  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [lightTone, setLightTone] = useState("");

  const addBreaksAfterPeriods = (text: string): string => {
    return text.replace(/\./g, ".<br>");
  };

  const colors = [
    { name: "Blanco", hex: "#F5F5F5" },
    { name: "Negro", hex: "#000000" },
    { name: "Platín", hex: "#E5E4E2" },
    { name: "Bronce", hex: "#CD7F32" },
    { name: "Cobre", hex: "#B87333" },
    { name: "Gris", hex: "#808080" },
    { name: "Madera", hex: "#8B4513" },
  ];

  const sizes = ["Pequeño", "Mediano", "Grande", "Extra Grande"];
  const lightTones = ["Cálido", "Neutro", "Frío", "Luz del Día", "Anochecer"];

  const quillRef = useRef(null);

  useEffect(() => {
    console.log(quillRef.current);
  }, [quillRef]);

  const [activeTab, setActiveTab] = useState<string>("briefDescription");
  const [productDescription, setProductDescription] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mainImageUrl, setMainImageUrl] = useState<File | null>(null);
  const [previewImages, setPreviewImages] = useState<File[]>([]);

  const [productBriefDescription, setProductBriefDescription] = useState("");
  const [additionalInformation, setAdditionalInformation] = useState("");
  const [category, setCategory] = useState("");
  const [isOnSale, setIsOnSale] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [productStock, setProductStock] = useState<any>(1);

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("productbr", productBriefDescription);

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
    formData.append("stock", productStock);

    selectedColors.forEach((color) => {
      formData.append("colors", color);
    });

    selectedSizes.forEach((size) => {
      formData.append("sizes", size);
    });

    formData.append("lightTone", lightTone);

    if (mainImageUrl) {
      formData.append("images", mainImageUrl, mainImageUrl.name);
    }

    previewImages.forEach((image: any, index: number) => {
      formData.append("images", image, `secondary-image-${index}`);
    });

    const response = await fetch("/api/add-product", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      setProductName("");
      setProductPrice(0);
      setProductDescription("");
      setProductBriefDescription("");
      setCategory(""); // Limpia la categoría
      setMainImageUrl(null); // Limpia la imagen principal
      setPreviewImages([]); // Limpia las imágenes de vista previa

      toast.success("El producto ha sido añadido.", {
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
    let newPreviewImages = [...previewImages];
    newPreviewImages[index] = e.target.files[0];
    setPreviewImages(newPreviewImages);
  };

  const generateProductDescription = async (
    product: string,
    additional: boolean = false
  ) => {
    setIsLoading(true);
    const prompt = !additional
      ? `Genera una descripción detallada para el producto ${product}, destacando todas sus características y beneficios.`
      : `Genera una muy breve introducción para el producto ${product}, resaltando sus puntos clave.`;

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
        console.log("response.data -> ", responseData);
        console.log("newlines.data -> ", addBreaksAfterPeriods(responseData));

        additional
          ? setProductBriefDescription(addBreaksAfterPeriods(responseData))
          : setProductDescription(addBreaksAfterPeriods(responseData));
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
            value={addBreaksAfterPeriods(value)}
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
            🛍️ Mi E-commerce
          </p>
          <input
            className="text-gray-800 bg-gray-200 mt-1 text-4xl w-full font-medium"
            value={productName}
            placeholder="Lámpara Moderna"
            onChange={(e) => setProductName(e.target.value)}
          />

          <div className="flex justify-between items-center mt-2 w-full">
            <div className="flex items-center">
              <span className="text-gray-700 text-2xl font-medium">$</span>
              <input
                className="text-gray-700 bg-gray-200 ml-2 w-1/2 text-2xl font-medium"
                value={productPriceInput}
                placeholder="1.200,00"
                type="text"
                onChange={(e: any) => {
                  // Permitir números y puntos
                  const onlyNumbersAndDots = e.target.value.replace(
                    /[^0-9.]/g,
                    ""
                  );
                  setProductPriceInput(onlyNumbersAndDots);
                  setProductPrice(processPrice(onlyNumbersAndDots));
                }}
                onBlur={() => {
                  if (productPrice !== null) {
                    setProductPriceInput(formatPriceARS(productPrice));
                  }
                }}
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-gray-600">🧮 Stock:</span>
              <input
                className="text-gray-700 border border-gray-400 bg-transparent rounded text-center flex justify-center h-8 p-2 w-10 text-lg font-medium"
                value={productStock}
                placeholder="1"
                type="number"
                onChange={(e: any) => setProductStock(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-5">
            <FormControl variant="outlined" fullWidth>
              <InputLabel htmlFor="outlined-category">Categoría</InputLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                label="Categoría"
              >
                {CATEGORIES.map((category, index) => (
                  <MenuItem key={index} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <div className="mt-5 grid grid-cols-3 gap-4">
              <FormControl variant="outlined" fullWidth>
                <InputLabel id="colors-label">Colores</InputLabel>
                <Select
                  labelId="colors-label"
                  id="colors"
                  multiple
                  value={selectedColors}
                  onChange={(e) =>
                    setSelectedColors(e.target.value as string[])
                  }
                  label="Colores"
                  renderValue={(selected) =>
                    (selected as string[])
                      .map((colorHex) => {
                        const color = colors.find((c) => c.hex === colorHex);
                        return color ? color.name : "";
                      })
                      .join(", ")
                  }
                >
                  {colors.map((colorOption, index) => (
                    <MenuItem key={index} value={colorOption.hex}>
                      <Checkbox
                        checked={selectedColors.includes(colorOption.hex)}
                      />
                      <ListItemText primary={colorOption.name} />
                      <div
                        style={{
                          width: "1rem",
                          height: "1rem",
                          borderRadius: "50%",
                          backgroundColor: colorOption.hex,
                          display: "inline-block",
                          marginLeft: "10px",
                        }}
                      ></div>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl variant="outlined" fullWidth>
                <InputLabel id="sizes-label">Tamaños</InputLabel>
                <Select
                  labelId="sizes-label"
                  id="sizes"
                  multiple
                  value={selectedSizes}
                  onChange={(e) => setSelectedSizes(e.target.value as string[])}
                  label="Tamaños"
                  renderValue={(selected) => (selected as string[]).join(", ")}
                >
                  {sizes.map((size, index) => (
                    <MenuItem key={index} value={size}>
                      <Checkbox checked={selectedSizes.includes(size)} />
                      <ListItemText primary={size} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl variant="outlined" fullWidth>
                <InputLabel>Tono de Luz</InputLabel>
                <Select
                  value={lightTone}
                  onChange={(e) => setLightTone(e.target.value)}
                  label="Tono de Luz"
                >
                  {lightTones.map((lightToneOption, index) => (
                    <MenuItem key={index} value={lightToneOption}>
                      {lightToneOption}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
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
              onClick={handleSubmitProduct}
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
              Cargar Producto
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
            ) : (
              <div>
                <img
                  src={IMAGE}
                  alt="Product Main"
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
            {previewImages.map((previewImage, index: number) => (
              <label
                key={index}
                htmlFor={`secondaryImage-${index}`}
                className="w-40 h-40 object-cover border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer"
              >
                {previewImage ? (
                  <img
                    src={URL.createObjectURL(previewImage)}
                    alt="Product Secondary"
                    className="object-cover h-full w-full rounded"
                  />
                ) : (
                  <img
                    src={IMAGE}
                    alt="Product Main"
                    className="w-full h-48 object-cover rounded"
                  />
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
              htmlFor={`secondaryImage-${previewImages.length}`}
              className="w-40 h-40 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer"
            >
              <img
                src={IMAGE}
                alt="Product Main"
                className="w-auto h-14 object-cover rounded"
              />
              <input
                id={`secondaryImage-${previewImages.length}`}
                type="file"
                onChange={(e) =>
                  handleSecondaryImagesChange(e, previewImages.length)
                }
                className="hidden"
              />
            </label>
          </div>

          <div className="lg:hidden w-full mt-8">
            <Button
              onClick={handleSubmitProduct}
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

export default AddProductPage;
