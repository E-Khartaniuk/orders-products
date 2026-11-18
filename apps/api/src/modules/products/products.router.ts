import { Router } from "express";
import { imageUpload, requireFile } from "../../lib/uploads.js";
import { validate, type Validated } from "../../middleware/validate.js";
import {
  createProductBody,
  listProductsQuery,
  productIdParams,
  type CreateProductBody,
  type ListProductsQuery,
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

productsRouter.get("/:id", validate({ params: productIdParams }), async (_req, res) => {
  const { params } = res.locals.validated as Validated<{ id: number }>;
  res.json(await productsService.getProduct(params.id));
});

productsRouter.post("/", validate({ body: createProductBody }), async (_req, res) => {
  const { body } = res.locals.validated as Validated<unknown, unknown, CreateProductBody>;
  res.status(201).json(await productsService.createProduct(body));
});

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
