import { Router } from "express";
import { validate, type Validated } from "../../middleware/validate.js";
import {
  createOrderBody,
  listOrdersQuery,
  orderIdParams,
  updateOrderBody,
  type CreateOrderBody,
  type ListOrdersQuery,
  type UpdateOrderBody,
} from "./orders.schemas.js";
import * as ordersService from "./orders.service.js";

export const ordersRouter = Router();

ordersRouter.get("/", validate({ query: listOrdersQuery }), async (_req, res) => {
  const { query } = res.locals.validated as Validated<unknown, ListOrdersQuery>;
  const items = await ordersService.listOrders(query);
  res.json({ items, total: items.length });
});

ordersRouter.get("/:id", validate({ params: orderIdParams }), async (_req, res) => {
  const { params } = res.locals.validated as Validated<{ id: number }>;
  res.json(await ordersService.getOrder(params.id));
});

ordersRouter.post("/", validate({ body: createOrderBody }), async (_req, res) => {
  const { body } = res.locals.validated as Validated<unknown, unknown, CreateOrderBody>;
  res.status(201).json(await ordersService.createOrder(body));
});

ordersRouter.patch(
  "/:id",
  validate({ params: orderIdParams, body: updateOrderBody }),
  async (_req, res) => {
    const { params, body } = res.locals.validated as Validated<
      { id: number },
      unknown,
      UpdateOrderBody
    >;
    res.json(await ordersService.updateOrder(params.id, body));
  },
);

ordersRouter.delete("/:id", validate({ params: orderIdParams }), async (_req, res) => {
  const { params } = res.locals.validated as Validated<{ id: number }>;
  await ordersService.deleteOrder(params.id);
  res.status(204).end();
});
