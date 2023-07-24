import {
  ERROR_MESSAGES,
  INTERNAL_SERVER_ERROR,
  METHOD_NOT_ALLOWED,
  OK,
} from "../utils/httpStatus";

export default async function handler(req: any, res: any) {
  if (req.method === "POST") {
    const {
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
      // Create a new FormData instance
      const formData = new FormData();
      formData.append("name", name);
      formData.append("price", price);
      formData.append("briefDescription", briefDescription);
      // formData.append("additionalInformation", additionalInformation);
      formData.append("description", description);
      formData.append("category", category);
      // formData.append("stock", stock);
      // formData.append("isOnSale", isOnSale);
      // formData.append("discount", discount);

      // Add each secondary image
      images.forEach((image: any) => formData.append("images", image));

      const requestOptions: RequestInit = {
        method: "POST",
        body: formData, // Use formData instead of JSON
        headers: { "Content-Type": "multipart/form-data" },
        redirect: "follow",
      };

      await fetch(`${process.env.BACKEND_URL}/api/add-product`, requestOptions)
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
