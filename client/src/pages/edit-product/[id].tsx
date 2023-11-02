import "react-toastify/dist/ReactToastify.css";
import React, { useEffect, useRef, useState } from "react";
import {
  Checkbox,
  FormControl,
  Input,
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
import { CATEGORIES, COLORS, FORMATS, LIGHT_TONES } from "src/utils/constants";
import { useRouter } from "next/router";
import {
  addBreaksAfterPeriods,
  formatPriceARS,
  processPrice,
} from "src/utils/functions";

// Import the editor component dynamically
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const EditProductPage = () => {
  const router = useRouter();
  const { id } = router.query; // Get the ID from the URL.

  // Product state hooks
  const [productName, setProductName] = useState<string>("");
  const [productPrice, setProductPrice] = useState<number | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [lightTone, setLightTone] = useState("");
  const quillRef = useRef(null);

  useEffect(() => {
    console.log(quillRef.current);
  }, [quillRef]);

  // Additional state hooks for product details
  const [activeTab, setActiveTab] = useState<string>("briefDescription");
  const [productDescription, setProductDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mainImageUrl, setMainImageUrl] = useState<File | null>(null);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [secondaryImageUrls, setSecondaryImageUrls] = useState<File[]>([]);
  const [productBriefDescription, setProductBriefDescription] = useState("");
  const [category, setCategory] = useState("");
  const [productStock, setProductStock] = useState<any>(1);
  const [additionalInformation, setAdditionalInformation] =
    useState("briefDescription");
  const [measurements, setMeasurements] = useState([
    { measure: "", price: "" },
  ]);

  // Handle the change of the main image
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setMainImageFile(event.target.files[0]);
      const imageUrl: any = URL.createObjectURL(event.target.files[0]);
      setMainImageUrl(imageUrl);
    }
  };

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (id) {
        const response = await fetch(`/api/product/${id}`);
        if (response.ok) {
          const product = await response.json();
          console.log("product", product);

          // If the product has measurements, set them to the state.
          if (product.measurements && product.measurements.length > 0) {
            setMeasurements(product.measurements);
          }
          // Assign the product data to the respective states.
          setProductName(product.name);
          setProductPrice(product.price);
          setProductDescription(product.description);
          setAdditionalInformation(product.additionalInformation);
          setCategory(product.category);
          setMainImageUrl(product.mainImageUrl);
          console.log("PRODUCT FETCH: ", product.mainImageUrl);
          setSecondaryImageUrls(product.secondaryImageUrls);
          setSelectedColors(product.colors);
          setLightTone(product.lightTone);
        }
      }
    };

    fetchProductDetails();

    console.log("prodprce", productPrice);
  }, [id]);

  const handleSubmitUpdateProduct = async (e: React.FormEvent) => {
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
      formData.append(`measurements[${index}][measure]`, measurement.measure);
      formData.append(`measurements[${index}][price]`, measurement.price);
    });

    selectedColors.forEach((color) => {
      formData.append("colors", color);
    });

    formData.append("lightTone", lightTone);

    if (mainImageUrl) {
      formData.append("mainImageUrl", mainImageUrl);
    }

    // previewImages.forEach((image:any, index:number) => {
    //   formData.append("images", image, `secondary-image-${index}`);
    // });

    const response = await fetch(`/api/edit-product/${id}`, {
      method: "PUT",
      body: formData,
    });

    if (response.ok) {
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
      toast.error("El producto no se ha podido ser actualizado.", {
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

        additional
          ? setAdditionalInformation(addBreaksAfterPeriods(responseData))
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

  const handleMeasurementChange = (
    index: number,
    field: "measure" | "price",
    value: string
  ) => {
    const newMeasurements = [...measurements];
    newMeasurements[index][field] = value;
    setMeasurements(newMeasurements);
  };

  const addMeasurementField = () => {
    setMeasurements((prev) => [...prev, { measure: "", price: "" }]);
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

  return (
    <>
      <div className="lg:flex w-full gap-8">
        <div className="w-full lg:1/2">
          <p className="uppercase font-medium text-sm text-gray-500">
            🛍️ Mi E-commerce
          </p>
          <div className="flex gap-5 items-center">
            <input
              className="text-gray-800 bg-gray-200 mt-1 text-4xl w-3/4 font-medium"
              value={productName}
              placeholder="Lámpara Moderna"
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
                        const filteredValue = inputValue.replace(
                          /[^0-9.]/g,
                          ""
                        );
                        handleMeasurementChange(index, "price", filteredValue);
                      }}
                      onBlur={() => {
                        if (measurement.price) {
                          handleMeasurementChange(
                            index,
                            "price",
                            formatPriceARS(processPrice(measurement.price))
                          );
                        }
                      }}
                      className="p-2 border rounded w-40" // added some styling
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
                        const color = COLORS.find((c) => c.hex === colorHex);
                        return color ? color.name : "";
                      })
                      .join(", ")
                  }
                >
                  {COLORS.map((colorOption, index) => (
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
