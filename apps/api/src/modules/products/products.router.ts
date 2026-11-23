import { Router } from "express";
import { imageUpload, requireFile } from "../../lib/uploads.js";
import { validate, type Validated } from "../../middleware/validate.js";
import {
  createProductBody,
  listProductsQuery,
  listSpecificationsQuery,
  productIdParams,
  updateProductBody,
  type CreateProductBody,
  type ListProductsQuery,
  type ListSpecificationsQuery,
  type UpdateProductBody,
} from "./products.schemas.js";
import * as productsService from "./products.service.js";

export const productsRouter = Router();

productsRouter.get("/", validate({ query: listProductsQuery }), async (_req, res) => {
  const { query } = res.locals.validated as Validated<unknown, ListProductsQuery>;
  const items = await productsService.listProducts(query);
  res.json({ items, total: items.length });
});

productsRouter.get("/types", async (_req, res) => {
  res.json({ items: await productsService.listProductTypes() });
});

productsRouter.get(
  "/specifications",
  validate({ query: listSpecificationsQuery }),
  async (_req, res) => {
    const { query } = res.locals.validated as Validated<unknown, ListSpecificationsQuery>;
    res.json({ items: await productsService.listProductSpecifications(query) });
  },
);

productsRouter.get("/:id", validate({ params: productIdParams }), async (_req, res) => {
  const { params } = res.locals.validated as Validated<{ id: number }>;
  res.json(await productsService.getProduct(params.id));
});

productsRouter.post("/", validate({ body: createProductBody }), async (_req, res) => {
  const { body } = res.locals.validated as Validated<unknown, unknown, CreateProductBody>;
  res.status(201).json(await productsService.createProduct(body));
});

productsRouter.patch(
  "/:id",
  validate({ params: productIdParams, body: updateProductBody }),
  async (_req, res) => {
    const { params, body } = res.locals.validated as Validated<
      { id: number },
      unknown,
      UpdateProductBody
    >;
    res.json(await productsService.updateProduct(params.id, body));
  },
);

productsRouter.delete("/:id", validate({ params: productIdParams }), async (_req, res) => {
  const { params } = res.locals.validated as Validated<{ id: number }>;
  await productsService.deleteProduct(params.id);
  res.status(204).end();
});

productsRouter.put(
  "/:id/photo",
  validate({ params: productIdParams }),
  imageUpload("photo"),
  async (req, res) => {
    const { params } = res.locals.validated as Validated<{ id: number }>;
    res.json(await productsService.setProductPhoto(params.id, requireFile(req.file, "photo")));
  },
);

productsRouter.delete("/:id/photo", validate({ params: productIdParams }), async (_req, res) => {
  const { params } = res.locals.validated as Validated<{ id: number }>;
  res.json(await productsService.removeProductPhoto(params.id));
});
