import React, { useEffect, useRef, useState } from "react";
import {
  Checkbox,
  FormControl,
  Input,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Button,
} from "@mui/material";
import dynamic from "next/dynamic";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Importing necessary utility functions and constants
import { IMAGE, STARS_COPILOT_ICON } from "src/utils/images/icons";
import LoadingSpinner from "src/@core/components/loading-spinner";
import { CATEGORIES, COLORS, FORMATS, LIGHT_TONES } from "src/utils/constants";
import { addBreaksAfterPeriods } from "src/utils/functions";
import { Color } from "src/utils/interfaces";

// Lazy-load ReactQuill for better performance and to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

// AddProductPage component definition
const AddProductPage = () => {
  // State hooks for managing product information
  const [productName, setProductName] = useState("");
  const [selectedColors, setSelectedColors] = useState([]);
  const [lightTone, setLightTone] = useState("");
  const [colors, setColors] = useState<Color[]>([]);

  // Ref hook for accessing ReactQuill instance directly
  const quillRef = useRef<any>(null);

  // Effect for logging the Quill instance on mount
  useEffect(() => {}, []);

  // More state hooks for UI control and product details
  const [activeTab, setActiveTab] = useState("briefDescription");
  const [additionalInformation, setAdditionalInformation] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mainImageUrl, setMainImageUrl] = useState<any>(null);
  const [previewImages, setPreviewImages] = useState([]);
  const [measurements, setMeasurements] = useState([{ measure: "", price: 0 }]);
  const [category, setCategory] = useState("");
  const [productStock, setProductStock] = useState(1);

  // Function for showing error messages using react-toastify
  const showErrorMessage = (message: string) => {
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
  };

  // Handler for submitting the product form
  const handleSubmitProduct = async (e: any) => {
    e.preventDefault();

    // Validación de campos
    if (!productName) {
      return showErrorMessage("El nombre del producto está vacío");
    }

    if (!additionalInformation) {
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

    if (
      measurements.some(
        (measurement) => !measurement.measure || !measurement.price
      )
    ) {
      return showErrorMessage(
        "Ensure all measurements have both measure and price filled"
      );
    }

    // Preparing data to send to the server
    const formData = new FormData();
    formData.append("name", productName);
    formData.append("additionalInformation", additionalInformation);
    formData.append("description", productDescription);
    formData.append("category", category);
    formData.append("stock", String(productStock)); // Ensure stock is a string
    measurements.forEach((measurement, index) => {
      // Reemplaza la coma por un punto

      formData.append(`measurements[${index}][measure]`, measurement.measure);
      formData.append(
        `measurements[${index}][price]`,
        measurement.price.toString()
      );
    });

    selectedColors.forEach((color) => {
      formData.append("colors", color);
    });

    formData.append("lightTone", lightTone);

    if (mainImageUrl) {
      formData.append("images", mainImageUrl, mainImageUrl.name);
    }

    previewImages.forEach((image, index) => {
      formData.append("images", image, `secondary-image-${index}`);
    });

    try {
      const response = await fetch("/api/add-product", {
        method: "POST",
        body: formData,
      });

      // Handling the response from the server
      if (response.ok) {
        // Clearing the form after successful submission
        setProductName("");
        setMeasurements([{ measure: "", price: 0 }]);
        setProductDescription("");
        setAdditionalInformation("");
        setCategory("");
        setMainImageUrl(null);
        setPreviewImages([]);

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
        toast.error("El producto no se ha podido ser añadido.", {
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
    } catch (error) {
      console.error(error);
      alert("Error while adding product");
    }
  };

  // Function for handling changes in secondary images
  const handleSecondaryImagesChange = (event: any, index: number) => {
    const newFile = event.target.files[0];
    if (!newFile) return; // Previene la actualización si no hay un archivo seleccionado

    // Actualiza la imagen existente en el índice específico o agrega una nueva
    setPreviewImages((prevImages: any) => {
      if (index < prevImages.length) {
        return prevImages.map((img: string, imgIndex: number) =>
          imgIndex === index ? newFile : img
        );
      } else {
        return [...prevImages, newFile];
      }
    });
  };

  // Function for generating product descriptions
  const generateProductDescription = async (
    product: any,
    additional = false
  ) => {
    setIsLoading(true);
    const prompt = additional
      ? `Create a very brief introduction in Spanish for the product ${product}, highlighting its key points.`
      : `Generate a detailed description in Spanish for the product ${product}, highlighting all its features and benefits.`;

    try {
      const response = await fetch("/api/product-completion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: prompt }),
      });

      if (!response.ok) throw new Error("Error with product completion API");

      const responseData = await response.text();
      const formattedResponse = addBreaksAfterPeriods(responseData);
      additional
        ? setAdditionalInformation(formattedResponse)
        : setProductDescription(formattedResponse);
    } catch (error) {
      console.error(error);
      alert("Error during description generation");
    } finally {
      setIsLoading(false);
    }
  };

  // Custom hook for the DescriptionEditor component
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
            formats={FORMATS}
          />
        </div>
      );
    },
    []
  );

  const handleMeasurementChange = (index: number, field: any, value: any) => {
    const updatedMeasurements = measurements.map((measurement, i) =>
      i === index ? { ...measurement, [field]: value } : measurement
    );

    if (field === "price") {
      updatedMeasurements[index].price = parseFloat(value) || 0;
    }

    setMeasurements(updatedMeasurements);
  };

  const addMeasurementField = () => {
    setMeasurements((prev: any) => [...prev, { measure: "", price: 0 }]);
  };

  useEffect(() => {
    const fetchColors = async () => {
      const response = await fetch("/api/colors");
      const data = await response.json();
      setColors(data);
    };

    fetchColors();
  }, []);

  return (
    <>
      <div className="lg:flex w-full gap-8">
        <div className="w-full lg:1/2">
          <p className="uppercase font-medium text-sm text-gray-500">
            🛍️ Mi E-commerce
          </p>
          <div className="flex gap-5 items-center">
            <input
              className="text-gray-800 px-2 h-14 bg-gray-200 mt-1 text-4xl w-3/4 font-medium"
              value={productName}
              placeholder="Nombre del Producto"
              onChange={(e) => setProductName(e.target.value)}
            />

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

          <div className="flex justify-between items-center mt-2 w-full">
            <div className="mt-4">
              {measurements.map((measurement, index) => (
                <div key={index} className="flex items-center gap-4 mb-2">
                  <Input
                    type="text"
                    value={measurement.measure}
                    onChange={(e) =>
                      handleMeasurementChange(index, "measure", e.target.value)
                    }
                    placeholder="Medida"
                    className="p-2 border rounded w-1/3"
                  />
                  <div className="flex items-center">
                    <span className="text-gray-700 text-xl font-medium mr-2">
                      $
                    </span>
                    <Input
                      type="text"
                      value={measurement.price}
                      placeholder="Precio"
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        handleMeasurementChange(index, "price", inputValue);
                      }}
                      className="p-2 border rounded w-40"
                    />
                  </div>
                  {index === measurements.length - 1 && (
                    <button
                      onClick={addMeasurementField}
                      className="ml-4 flex items-center justify-center bg-blue-600 text-white h-8 w-8 rounded-full hover:bg-blue-700 transition duration-300 ease-in-out shadow-md hover:shadow-lg"
                      aria-label="Agregar Medida/Precio"
                    >
                      +
                    </button>
                  )}
                </div>
              ))}
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

            <div className="mt-5 grid grid-cols-2 gap-4">
              <FormControl variant="outlined" fullWidth>
                <InputLabel id="colors-label">Colores</InputLabel>
                <Select
                  labelId="colors-label"
                  id="colors"
                  multiple
                  value={selectedColors}
                  onChange={(e: any) => setSelectedColors(e.target.value)}
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
                  {colors.map((colorOption: any, index: number) => (
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
                <InputLabel>Tono de Luz</InputLabel>
                <Select
                  value={lightTone}
                  onChange={(e) => setLightTone(e.target.value)}
                  label="Tono de Luz"
                >
                  {LIGHT_TONES.map((lightToneOption, index) => (
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
              quillRef={quillRef}
              onChange={setProductDescription}
              generateDescription={() =>
                generateProductDescription(productName)
              }
              loading={isLoading}
            />
          )}
          {activeTab === "briefDescription" && (
            <DescriptionEditor
              value={additionalInformation}
              onChange={setAdditionalInformation}
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
            {previewImages.map((previewImage, index) => (
              <label
                key={index}
                htmlFor={`secondaryImage-${index}`}
                className="w-40 h-40 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer"
              >
                {previewImage && (
                  <img
                    src={URL.createObjectURL(previewImage)}
                    alt={`Product Secondary ${index}`}
                    className="object-cover h-full w-full rounded"
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
                alt="Add New Product"
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
