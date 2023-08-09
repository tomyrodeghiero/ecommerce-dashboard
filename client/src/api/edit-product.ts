import {
  ERROR_MESSAGES,
  INTERNAL_SERVER_ERROR,
  METHOD_NOT_ALLOWED,
  OK,
} from "../utils/httpStatus";

export default async function handler(req: any, res: any) {
  if (req.method === "PUT") {
    // Notamos que estamos escuchando un método PUT
    const {
      id,
      name,
      price,
      description,
      briefDescription,
      additionalInformation,
      images,
      stock,
      isOnSale,
      discount,
      category,
    } = req.body;

    try {
      // Crear una nueva instancia de FormData
      const formData = new FormData();
      formData.append("name", name);
      formData.append("price", price);
      formData.append("briefDescription", briefDescription);
      formData.append("description", description);
      formData.append("category", category);

      // Si las propiedades están presentes, las agregamos al FormData
      if (additionalInformation)
        formData.append("additionalInformation", additionalInformation);
      if (stock) formData.append("stock", stock.toString()); // Convertir a string si es un número
      if (typeof isOnSale === "boolean")
        formData.append("isOnSale", isOnSale.toString());
      if (discount) formData.append("discount", discount.toString());

      // Agregar cada imagen secundaria
      images.forEach((image: any) => formData.append("images", image));

      const requestOptions: RequestInit = {
        method: "PUT", // Método actualizado a PUT
        body: formData, // Usar formData en lugar de JSON
        headers: { "Content-Type": "multipart/form-data" },
        redirect: "follow",
      };

      // Usar el ID del producto en el URL del endpoint
      await fetch(
        `${process.env.BACKEND_URL}/api/edit-product/${id}`,
        requestOptions
      )
        .then((response) => response.json())
        .then((result) => {
          res.status(OK).json(result);
        })
        .catch((error) => {
          console.error("error", error);
          res
            .status(INTERNAL_SERVER_ERROR)
            .json({ error: ERROR_MESSAGES[INTERNAL_SERVER_ERROR] });
        });
    } catch (error) {
      console.error(error);
      res
        .status(INTERNAL_SERVER_ERROR)
        .json({ error: ERROR_MESSAGES[INTERNAL_SERVER_ERROR] });
    }
  } else {
    res
      .status(METHOD_NOT_ALLOWED)
      .json({ error: ERROR_MESSAGES[METHOD_NOT_ALLOWED] });
  }
}
