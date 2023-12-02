export default async function handler(req: any, res: any) {
  if (req.method === "POST") {
    const {
      name,
      description,
      briefDescription,
      additionalInformation,
      images,
      stock,
      isOnSale,
      discount,
      category,
      colors,
      sizes,
      lightTone,
      measurements,
      username,
      price,
    } = req.body;

    try {
      const requestOptions: any = {
        method: "POST",
        body: JSON.stringify({
          name,
          description,
          briefDescription,
          additionalInformation,
          images,
          stock,
          isOnSale,
          discount,
          category,
          colors,
          sizes,
          lightTone,
          measurements,
          username,
          price,
        }),
        headers: { "Content-Type": "application/json" },
        redirect: "follow",
      };

      const response = await fetch(
        `${process.env.BACKEND_URL}/api/add-product`,
        requestOptions
      );
      const result = await response.json();

      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
