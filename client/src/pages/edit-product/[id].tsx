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
import { IMAGE } from "src/utils/images/icons";
import Button from "@mui/material/Button";
import {
  SOPHILUM_CATEGORIES,
  FORMATS,
  LIGHT_TONES,
  JOYAS_BOULEVARD_CATEGORIES,
  DPASTEL_CATEGORIES,
  D_PASTEL_SUBCATEGORIES,
} from "src/utils/constants";
import { useRouter } from "next/router";
import { addBreaksAfterPeriods, getSubcategoriesOptions } from "src/utils/functions";
import { Color } from "src/utils/interfaces";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const EditProductPage = () => {
  const router = useRouter();
  const { id }: any = router.query;

  const [mainImageFile, setMainImageFile] = useState(null);
  const [secondaryImageFiles, setSecondaryImageFiles] = useState([]);
  const [userType, setUserType] = useState("");
  useEffect(() => {
    const storedUserType: any = localStorage.getItem("userType");
    setUserType(storedUserType);
  }, []);

  // Product state hooks
  const [productName, setProductName] = useState<string>("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [lightTone, setLightTone] = useState("");
  const [colors, setColors] = useState<Color[]>([]);
  const [price, setPrice] = useState<any>(null);

  const quillRef = useRef(null);

  useEffect(() => { }, [quillRef]);

  // Additional state hooks for product details
  const [activeTab, setActiveTab] = useState<string>("");
  const [productDescription, setProductDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mainImageUrl, setMainImageUrl] = useState<any | null>(null);
  const [secondaryImageUrls, setSecondaryImageUrls] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [productStock, setProductStock] = useState<any>(1);
  const [additionalInformation, setAdditionalInformation] =
    useState("briefDescription");
  const [measurements, setMeasurements] = useState([{ measure: "", price: 0 }]);

  // Handle the change of the main image
  const handleMainImageChange = async (event: any) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setMainImageFile(file);
      setMainImageUrl(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (id) {
        const response = await fetch(`/api/product/${id}`);
        if (response.ok) {
          const product = await response.json();

          // If the product has measurements, set them to the state
          if (product.measurements && product.measurements.length > 0) {
            // If the product has measurements, format them to have two decimals
            const formattedMeasurements = product.measurements.map(
              (m: any) => ({
                ...m,
                price: parseFloat(m.price).toFixed(2),
              })
            );

            setMeasurements(formattedMeasurements);
          }

          // Assign the product data to the respective states.
          setProductName(product.name);
          setPrice(product.price);
          setProductDescription(product.description);
          setAdditionalInformation(product.additionalInformation);
          setCategory(product.category);
          setMainImageUrl(product.mainImageUrl);
          setSecondaryImageUrls(product.secondaryImageUrls);
          setLightTone(product.lightTone);

          let parsedSelectedColors = [];
          if (product && product.colors) {
            try {
              parsedSelectedColors = product.colors.map((colorString: string) =>
                JSON.parse(colorString)
              );
            } catch (error) {
              console.error("Error to parse colors", error);
            }
          }
          setSelectedColors(parsedSelectedColors);
        }
      }
    };

    fetchProductDetails();
  }, [id]);

  useEffect(() => {
    if (userType === "dpastel") {
      setActiveTab("description");
    } else {
      setActiveTab("briefDescription");
    }
  }, [userType]);

  const handleSubmitUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación de campos
    if (!productName) {
      return showErrorMessage("El nombre del producto está vacío");
    }

    if (!(userType === "dpastel") && !additionalInformation) {
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
        "La Imagen principal del producto está vacía"
      );
    }

    if (
      userType === "sophilum" || userType === "dpastel" &&
      measurements.some(
        (measurement) => !measurement.measure || !measurement.price
      )
    ) {
      return showErrorMessage(
        "Asegúrese de que todas las medidas y precios estén completos"
      );
    }

    // Preparing data to send to the server
    const formData = new FormData();

    formData.append("id", id);
    formData.append("name", productName);
    formData.append("description", productDescription);
    formData.append("additionalInformation", additionalInformation);
    formData.append("stock", productStock.toString());
    formData.append("category", category);
    formData.append("lightTone", lightTone);

    selectedColors.forEach((color, index) => {
      formData.append(`colors[${index}]`, JSON.stringify(color));
    });

    measurements.forEach((measurement, index) => {
      formData.append(`measurements[${index}][measure]`, measurement.measure);
      formData.append(`measurements[${index}][price]`, measurement.price.toString());
    });

    if (userType === "joyasboulevard") {
      formData.append("price", price.toString());
    }

    // Append main image if it exists
    if (mainImageFile) {
      formData.append("images", mainImageFile);
    }

    // Append secondary images if they exist
    secondaryImageFiles.forEach((file, index) => {
      if (file) {
        formData.append("images", file);
      }
    });

    try {
      const response = await fetch(`/api/edit-product/${id}`, {
        method: 'PUT',
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
        throw new Error('Error updating product');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("El producto no se ha podido actualizar.", {
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

  const handleSecondaryImageChange = async (event: any, index: number) => {
    const newFile = event.target.files[0];
    if (newFile) {
      setSecondaryImageFiles((prev) => {
        const updatedFiles: any = [...prev];
        updatedFiles[index] = newFile;
        return updatedFiles;
      });
      setSecondaryImageUrls((prevUrls) => {
        const updatedUrls = [...prevUrls];
        updatedUrls[index] = URL.createObjectURL(newFile);
        return updatedUrls;
      });
    }
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

  const handleMeasurementChange = (index: number, field, value) => {
    const updatedMeasurements = measurements.map((measurement, i) =>
      i === index ? { ...measurement, [field]: value } : measurement
    );

    setMeasurements(updatedMeasurements);
  };

  const addMeasurementField = () => {
    setMeasurements((prev: any) => [...prev, { measure: "", price: 0 }]);
  };

  // Custom hook for the DescriptionEditor component
  const DescriptionEditor = React.useCallback(
    ({ value, onChange, generateDescription, loading }: any) => {
      return (
        <div className="relative">
          {/* {loading ? (
            <LoadingSpinner />
          ) : (
            <img
              className="absolute cursor-pointer right-2 top-2 text-white px-2 py-1"
              onClick={generateDescription}
              src={STARS_COPILOT_ICON}
              alt="Stars Copilot"
            />
          )} */}
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

  useEffect(() => {
    const fetchColors = async () => {
      const response = await fetch("/api/colors");
      const data = await response.json();
      setColors(data);
    };

    fetchColors();
  }, []);

  const handlePriceBlur = (index: number) => {
    const updatedMeasurements = measurements.map(
      (measurement: any, i: number) => {
        if (i === index && measurement.price) {
          return {
            ...measurement,
            price: parseFloat(measurement.price).toFixed(2),
          };
        }
        return measurement;
      }
    );

    setMeasurements(updatedMeasurements);
  };

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
                  {(userType === "sophilum" || userType === "dpastel") && (
                    <Input
                      type="text"
                      value={measurement.measure}
                      onChange={(e) =>
                        handleMeasurementChange(
                          index,
                          "measure",
                          e.target.value
                        )
                      }
                      placeholder="Medida"
                      className="p-2 border rounded w-1/3"
                    />
                  )}
                  <div className="flex items-center">
                    <span className="text-gray-700 text-xl font-medium mr-2">
                      $
                    </span>
                    {userType === "joyasboulevard" && (
                      <Input
                        type="text"
                        value={price}
                        placeholder="Precio"
                        onBlur={() => setPrice(parseFloat(price).toFixed(2))}
                        onChange={(e) => setPrice(e.target.value)}
                        className="p-2 border rounded w-40"
                      />
                    )}

                    {(userType === "sophilum" || userType === "dpastel") && (
                      <Input
                        type="text"
                        value={measurement.price}
                        placeholder="Precio"
                        onBlur={() => handlePriceBlur(index)}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          handleMeasurementChange(index, "price", inputValue);
                        }}
                        className="p-2 border rounded w-40"
                      />
                    )}
                  </div>
                  {(userType === "sophilum" || userType === "dpastel") &&
                    index === measurements.length - 1 && (
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
                {(userType === "sophilum"
                  ? SOPHILUM_CATEGORIES
                  : userType === "dpastel"
                    ? DPASTEL_CATEGORIES
                    : JOYAS_BOULEVARD_CATEGORIES
                ).map((category, index) => (
                  <MenuItem key={index} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {(userType === "sophilum" || userType === "dpastel") && (
              <div className="mt-5 grid grid-cols-2 gap-4">
                <FormControl variant="outlined" fullWidth>
                  <InputLabel id="colors-label">Colores</InputLabel>
                  <Select
                    labelId="colors-label"
                    id="colors"
                    multiple
                    value={selectedColors.length > 0 ? selectedColors.map((color: any) => color.hex) : []}
                    onChange={(e: any) => {
                      const selectedColorObjects = e.target.value.map((selectedHex: any) => {
                        return colors.find((color) => color.hex === selectedHex);
                      });
                      setSelectedColors(selectedColorObjects);
                    }}
                    label="Colores"
                    renderValue={(selected) => {
                      if (selected.length === 0) {
                        return '';
                      }
                      return selected
                        .map((colorHex) => {
                          const color = colors.find((c) => c.hex === colorHex);
                          return color ? color.name : '';
                        })
                        .join(', ');
                    }}
                  >
                    {colors.map((colorOption, index) => (
                      <MenuItem key={index} value={colorOption.hex}>
                        <Checkbox
                          checked={selectedColors.some(
                            (color) => color.hex === colorOption.hex
                          )}
                        />
                        <ListItemText primary={colorOption.name} />
                        <div
                          style={{
                            width: '1rem',
                            height: '1rem',
                            borderRadius: '50%',
                            backgroundColor: colorOption.hex,
                            display: 'inline-block',
                            marginLeft: '10px'
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
                    {getSubcategoriesOptions(userType).map((option, index) => (
                      <MenuItem key={index} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            )}
          </div>

          <div className="border-b mt-2 lg:mt-1 mb-5 flex justify-between border-gray-300">
            {!(userType === "dpastel") &&
              <button
                className={`flex-grow flex justify-center py-3 items-center ${activeTab === "briefDescription"
                  ? "border-b-2 border-black"
                  : "text-gray-700"
                  }`}
                onClick={() => setActiveTab("briefDescription")}
              >
                Introducción
              </button>
            }
            <button
              className={`flex-grow flex justify-center py-3 items-center ${activeTab === "description"
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
                backgroundColor:
                  userType === "sophilum" ? "#E8B600" : "#212121",
                boxShadow:
                  userType === "sophilum"
                    ? "0 1px 14px 1px #E8B600"
                    : "0 1px 14px 1px #212121",
                "&:hover": {
                  boxShadow: "none",
                  backgroundColor:
                    userType === "sophilum" ? "#F1A700" : "#000000",
                },
              }}
            >
              Actualizar Producto
            </Button>
          </div>

          <label
            htmlFor="productMainImage"
            className="w-full h-96 rounded border-2 mt-5 border-dashed border-gray-300 flex items-center justify-center cursor-pointer"
          >
            {/* Muestra la imagen principal actual */}
            {mainImageUrl ? (
              <img
                src={mainImageUrl}
                alt="Product Main"
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <img
                src={IMAGE}
                alt="Product Main"
                className="w-full h-32 object-cover rounded"
              />
            )}
            <input
              type="file"
              id="productMainImage"
              onChange={handleMainImageChange}
              className="hidden"
            />
          </label>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full mt-4">
            {secondaryImageUrls.map((url, index) => (
              <label
                key={index}
                htmlFor={`secondaryImage-${index}`}
                className="w-40 h-40 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer"
              >
                {url ? (
                  <img
                    src={url}
                    alt={`Producto Secundario ${index}`}
                    className="object-cover h-full w-full rounded"
                  />
                ) : (
                  <img
                    src={IMAGE}
                    alt="Agregar Nueva Imagen"
                    className="w-auto h-14 object-cover rounded"
                  />
                )}
                <input
                  type="file"
                  id={`secondaryImage-${index}`}
                  onChange={(e) => handleSecondaryImageChange(e, index)}
                  className="hidden"
                />
              </label>
            ))}
            {secondaryImageUrls.length < 3 && (
              <label
                htmlFor={`secondaryImage-${secondaryImageUrls.length}`}
                className="w-40 h-40 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer"
              >
                <img
                  src={IMAGE}
                  alt="Agregar Nueva Imagen"
                  className="w-auto h-14 object-cover rounded"
                />
                <input
                  type="file"
                  id={`secondaryImage-${secondaryImageUrls.length}`}
                  onChange={(e) =>
                    handleSecondaryImageChange(e, secondaryImageUrls.length)
                  }
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="lg:hidden w-full mt-8">
            <Button
              onClick={handleSubmitUpdateProduct}
              variant="contained"
              sx={{
                backgroundColor:
                  userType === "sophilum" ? "#E8B600" : "#212121",
                boxShadow:
                  userType === "sophilum"
                    ? "0 1px 14px 1px #E8B600"
                    : "0 1px 14px 1px #212121",
                "&:hover": {
                  boxShadow: "none",
                  backgroundColor:
                    userType === "sophilum" ? "#F1A700" : "#000000",
                },
              }}
            >
              Actualizar Producto
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
