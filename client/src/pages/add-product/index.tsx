import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import React, { useState } from "react";
import ReactQuill from "react-quill";
import dynamic from "next/dynamic";
import { STARS_COPILOT_ICON } from "src/utils/images/icons";

const DynamicReactQuill = dynamic(
  () => import("react-quill"), // replace 'react-quill' with your npm package
  { ssr: false } // this will made it run on client side
);

const AddProductPage = () => {
  const [productName, setProductName] = useState("Collar de Oro");
  const [productPrice, setProductPrice] = useState(1200);
  const [activeTab, setActiveTab] = useState<string>("description");
  const [description, setDescription] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  if (typeof window === "undefined") return null;

  return (
    <div className="lg:flex w-full">
      <div className="w-full lg:1/2">
        <p className="uppercase font-medium text-sm text-gray-500">
          ⌚ Joyería & Relogería
        </p>
        <input
          className="text-gray-800 bg-gray-200 mt-1 text-4xl font-medium"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        />

        <div className="flex items-center mt-2">
          <span className="text-gray-700 text-2xl font-medium">$</span>
          <input
            className="text-gray-700 bg-gray-200 ml-2 text-2xl font-medium"
            value={productPrice}
            type="number"
            onChange={(e: any) => setProductPrice(e.target.value)}
          />
        </div>

        <div className="mt-5">
          <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label">Categoría</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              // value={age}
              label="Categoría"
              // onChange={handleChange}
            >
              <MenuItem value={10}>Collar</MenuItem>
              <MenuItem value={20}>Pulsera</MenuItem>
            </Select>
          </FormControl>
        </div>

        <div className="border-b mb-5 hidden lg:flex border-gray-300">
          <button
            className={`px-12 py-3 ${
              activeTab === "description"
                ? "border-b-2 border-black"
                : "text-gray-700"
            }`}
            onClick={() => setActiveTab("description")}
          >
            Breve introducción
          </button>
          <button
            className={`px-12 py-3 ${
              activeTab === "additionalInfo"
                ? "border-b-2 border-black"
                : "text-gray-700"
            }`}
            onClick={() => setActiveTab("additionalInfo")}
          >
            Descripción
          </button>
        </div>

        {activeTab === "description" && (
          <div className="relative">
            <img
              className="absolute cursor-pointer right-2 top-2 text-white px-2 py-1"
              onClick={async () => {
                const response = await fetch("/api/product-completion", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ product: productName }),
                });

                if (response.ok) {
                  const responseData = await response.json(); // Await the json promise
                  console.log("response", responseData);
                  setDescription(responseData);
                } else {
                  alert("error");
                }
              }}
              src={STARS_COPILOT_ICON}
              alt="Stars Copilot"
            />
            <DynamicReactQuill value={description} onChange={setDescription} />
          </div>
        )}
        {activeTab === "additionalInfo" && (
          <div className="relative">
            <img
              className="absolute cursor-pointer right-2 top-2 text-white px-2 py-1"
              onClick={async () => {
                const response = await fetch("/api/product-completion", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ product: productName }),
                });

                if (response.ok) {
                  const responseData = await response.json(); // Await the json promise
                  console.log("response", responseData);
                  setDescription(responseData);
                } else {
                  alert("error");
                }
              }}
              src={STARS_COPILOT_ICON}
              alt="Stars Copilot"
            />
            <DynamicReactQuill value={description} onChange={setDescription} />
          </div>
        )}
      </div>
      <div className="w-full lg:1/2">50%</div>
    </div>
  );
};

export default AddProductPage;
