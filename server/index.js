require("dotenv").config();

const { HfInference } = require("@huggingface/inference");

const HF_ACCESS_TOKEN = "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";

const express = require("express");
const morgan = require("morgan");
const paymentRoutes = require("./src/routes/payment.routes.js");
const cors = require("cors");
const { default: mongoose } = require("mongoose");
mongoose.set("strictQuery", false);
const Product = require("./models/Product.js");
const Color = require("./models/Color");
const bcrypt = require("bcryptjs");
const app = express();
const cookieParser = require("cookie-parser");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const AdminUser = require("./models/AdminUser.js");
const UserEmail = require('./models/UserEmail.js');

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:3000", process.env.FRONTEND_PUBLIC_URL],
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));

app.use(morgan("dev"));
app.use(paymentRoutes);

mongoose.connect(process.env.DB_HOST);

// GET all products with pagination
app.get("/api/products", async (req, res) => {
  try {
    const page = parseInt(req.query.page, 12) || 1; // Por defecto la página es 1
    const limit = parseInt(req.query.limit, 13) || 12;
    const skip = (page - 1) * limit;

    const total = await Product.countDocuments();
    const products = await Product.find().skip(skip).limit(limit);

    const totalPages = Math.ceil(total / limit);

    res.json({
      totalPages: totalPages,
      currentPage: page,
      totalProducts: total,
      products: products,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET a specific product by id
app.get("/api/product/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
    } else {
      res.json(product);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads",
    allowed_formats: ["jpg", "png", "jpeg", "gif"],
  },
});

const uploadMiddleware = multer({ storage });

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const adminUserDoc = await AdminUser.findOne({ username });

    if (!adminUserDoc) {
      return res.status(401).json({ message: "wrong credentials" });
    }

    const passOk = bcrypt.compareSync(password, adminUserDoc.password);

    if (!passOk) {
      return res.status(401).json({ message: "wrong credentials" });
    }

    // logged in
    res.status(200).json({ message: "login success" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
});

app.post("/api/logout", (req, res) => {
  res.cookie("token", "").json("okay");
});

app.post(
  "/api/add-product",
  uploadMiddleware.array("images"),
  async (req, res) => {
    try {
      const {
        name,
        description,
        category,
        stock,
        additionalInformation,
        isOnSale,
        discount,
        colors,
        sizes,
        lightTone,
        measurements,
        username,
        price,
      } = req.body;

      const mainImageUrl = req.files[0].path;
      const secondaryImageUrls = req.files.slice(1).map((file) => file.path);

      const product = new Product({
        name,
        description,
        mainImageUrl,
        additionalInformation,
        secondaryImageUrls,
        category,
        stock,
        isOnSale,
        discount,
        colors,
        sizes,
        lightTone,
        measurements,
        username,
        price,
      });

      await product.save();
      res.status(200).json({ message: "Product added successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Delete product by ID
app.delete("/api/delete-product/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    await Product.findByIdAndRemove(productId);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete product by name
app.delete("/api/delete-product/:name", async (req, res) => {
  try {
    const productName = req.params.name;
    const product = await Product.findOne({ name: productName });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await Product.findByIdAndRemove(product._id);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Edit product
app.put(
  "/api/edit-product/:id",
  uploadMiddleware.array("images"),
  async (req, res) => {
    const productId = req.params.id;
    const updatedFields = req.body;

    // Handle images if they exist
    if (req.files && req.files.length > 0) {
      const mainImageUrl = req.files[0].path;
      const secondaryImageUrls = req.files.slice(1).map((file) => file.path);

      updatedFields.mainImageUrl = mainImageUrl;
      updatedFields.secondaryImageUrls = secondaryImageUrls;
    }

    try {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).send("Product not found");
      }

      // Update only the provided fields
      for (let field in updatedFields) {
        product[field] = updatedFields[field];
      }

      await product.save();
      res.status(200).send("Product updated successfully");
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

// create an api to get all the products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/post-instagram", async (req, res) => {
  const token = process.env.INSTAGRAM_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;
  const imageUrl = req.body.imageUrl;
  const caption = req.body.caption;

  try {
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v12.0/${userId}/media`,
      {
        method: "POST",
        body: JSON.stringify({
          image_url: imageUrl,
          caption: caption,
          access_token: token,
        }),
        headers: { "Content-Type": "application/json" },
      }
    );

    const mediaResData = await mediaResponse.json();

    const publishResponse = await fetch(
      `https://graph.facebook.com/v12.0/${userId}/media_publish`,
      {
        method: "POST",
        body: JSON.stringify({
          creation_id: mediaResData.id,
          access_token: token,
        }),
        headers: { "Content-Type": "application/json" },
      }
    );

    const publishResData = await publishResponse.json();

    res.status(200).json({
      message: "Publicado en Instagram exitosamente",
      data: publishResData,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      message: "Error al intentar publicar en Instagram",
      error: error,
    });
  }
});

app.post("/api/copilot", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).send("Question is required");
    }

    const deleteProductPattern = /eliminar|borrar/gi;
    if (deleteProductPattern.test(question)) {
      // Extract product name from the user's message
      const productNamePattern = /'([^']*)'/;
      const match = question.match(productNamePattern);
      if (match) {
        const productName = match[1];

        // Find product by name
        const product = await Product.findOne({ name: productName });

        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }

        // Delete product
        await Product.findByIdAndRemove(product._id);
        return res
          .status(200)
          .json({ message: "Product deleted successfully" });
      }
    }

    const addProductPattern = /(carga|cargar|agrega|agregar|añade|añadir)/gi;
    if (addProductPattern.test(question)) {
      // Extract product name
      const productNamePattern = /nombre es '([^']*)'/;
      const productNameMatch = question.match(productNamePattern);

      // Extract product price
      const productPricePattern = /precio es (\d+(\.\d+)?)/;
      const productPriceMatch = question.match(productPricePattern);

      if (!productNameMatch || !productPriceMatch) {
        return res
          .status(400)
          .json({ message: "Product name and price are required" });
      }

      const productName = productNameMatch[1];
      const productPrice = parseFloat(productPriceMatch[1]);

      const product = new Product({
        name: productName,
        price: productPrice,
        briefDescription: "Bella joya", // Replace with actual brief description
        description: "Esta es una joya deslumbrante", // Replace with actual description
        mainImageUrl:
          "https://s2.abcstatics.com/media/estilo/2021/05/07/apertura-joyas-small-ku5B--1248x698@abc.jpg",
        additionalInformation: "Hecho con amor", // Replace with actual additional information
        secondaryImageUrls: [],
        category: "Jewel", // Replace with actual category
        stock: 10, // Replace with actual stock
        isOnSale: false,
        discount: 0,
      });

      await product.save();
      return res.status(201).json({ message: "Product added successfully" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

app.post("/api/product-completion", async (req, res) => {
  try {
    const { content } = req.body;

    const productCompletion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente servicial de Argentina especializado en marketing y redes sociales para comercio electrónico. Tu tarea es generar una descripción atractiva para el siguiente producto solicitado.",
        },
        {
          role: "user",
          content: `${content}`,
        },
      ],
    });
    res.send(productCompletion.data.choices[0].message.content);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});
// Utiliza la función formatPriceARS para formatear los precios
function formatPriceARS(price) {
  if (typeof price === "number") {
    let priceStr = price.toFixed(2).replace(".", ",");
    let [entirePart, decimalPart] = priceStr.split(",");
    let regex = /\B(?=(\d{3})+(?!\d))/g;
    entirePart = entirePart.replace(regex, ".");
    priceStr = entirePart + "," + decimalPart;
    return priceStr;
  }
  return price;
}

// PATCH prices of selected products by a percentage
app.patch("/api/products/price-increase", async (req, res) => {
  try {
    const { productIds, increasePercentage } = req.body;

    if (!productIds || increasePercentage === undefined) {
      return res
        .status(400)
        .json({ message: "Product IDs and increase percentage are required." });
    }

    const increaseFactor = 1 + Number(increasePercentage) / 100;

    if (isNaN(increaseFactor)) {
      return res
        .status(400)
        .json({ message: "Invalid increase percentage value." });
    }

    const updatePromises = productIds.map((productId) => {
      return Product.findById(productId).then((product) => {
        if (product) {
          if (typeof product.price === "number") {
            product.price *= increaseFactor;
          }

          product.measurements.forEach((measurement) => {
            if (typeof measurement.price === "number") {
              measurement.price *= increaseFactor;
            } else if (typeof measurement.price === "string") {
              let formattedPrice = parseFloat(
                measurement.price.replace(/\./g, "").replace(/,/g, ".")
              );
              if (!isNaN(formattedPrice)) {
                measurement.price = formattedPrice * increaseFactor;
              }
            }
          });

          return product.save();
        } else {
          return Promise.reject(
            new Error(`Product with ID: ${productId} not found`)
          );
        }
      });
    });

    await Promise.all(updatePromises);

    res.status(200).json({ message: "Products prices updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// colors
app.get("/api/colors", async (req, res) => {
  try {
    const colors = await Color.find();
    res.json(colors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener colores" });
  }
});

app.put("/api/update-colors", async (req, res) => {
  try {
    const { colors } = req.body;

    await Color.deleteMany({});
    await Color.insertMany(colors);
    res.status(200).json({ message: "Colores actualizados correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al actualizar colores" });
  }
});

// Endpoint to delete a specific color
app.delete("/api/delete-color/:id", async (req, res) => {
  try {
    const { colorId } = req.params; // Get the color ID from the URL

    // Delete the color with the given ID
    const result = await Color.deleteOne({ _id: colorId });

    // Check if the color was deleted
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Color no encontrado" });
    }

    res.status(200).json({ message: "Color eliminado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al eliminar color" });
  }
});

// Endpoint to save user emails
app.post('/api/user-emails', async (req, res) => {
  const { emailUser, ecommerceName } = req.body;

  try {
    const newUserEmail = new UserEmail({
      emailUser,
      ecommerceName
    });

    await newUserEmail.save();
    res.status(201).json({ message: 'Email successfully registered.', data: newUserEmail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error registering email.' });
  }
});

// Listen port
app.listen(5001);
console.log("Server listening on port", 5001);