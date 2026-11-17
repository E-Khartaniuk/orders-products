"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useTranslations } from "use-intl";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from "react-leaflet";
import type { OrderPoint } from "@/lib/stats";
import { CHART } from "./chart-theme";

const UKRAINE_CENTER: [number, number] = [48.8, 31.2];

export default function OrdersMap({ points }: { points: OrderPoint[] }) {
  const t = useTranslations("dashboard");
  const tOrders = useTranslations("orders");

  return (
    <div className="orders-map" role="region" aria-label={t("mapLabel")}>
      <MapContainer
        center={UKRAINE_CENTER}
        zoom={6}
        scrollWheelZoom={false}
        className="orders-map__canvas"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((point) => (
          <CircleMarker
            key={point.id}
            center={[point.latitude, point.longitude]}
            radius={8}
            pathOptions={{
              color: CHART.surface,
              weight: 2,
              fillColor: CHART.mark,
              fillOpacity: 0.85,
            }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              {point.city}
            </Tooltip>
            <Popup>
              <div className="orders-map__popup">
                <strong>{point.title}</strong>
                <span>
                  {point.city} · {tOrders("productsCount", { count: point.productsCount })}
                </span>
                <Link href={`/orders/${point.id}`}>{t("openOrder")}</Link>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
