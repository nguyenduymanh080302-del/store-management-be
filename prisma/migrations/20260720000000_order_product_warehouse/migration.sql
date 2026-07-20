-- Track the warehouse that supplies each individual order line.
ALTER TABLE "OrderProduct" ADD COLUMN "warehouseId" INTEGER;

-- Preserve the warehouse selected on existing orders where it is available.
UPDATE "OrderProduct"
SET "warehouseId" = "Order"."warehouseId"
FROM "Order"
WHERE "OrderProduct"."orderId" = "Order"."id"
  AND "OrderProduct"."warehouseId" IS NULL;

CREATE INDEX "OrderProduct_warehouseId_idx" ON "OrderProduct"("warehouseId");

ALTER TABLE "OrderProduct"
ADD CONSTRAINT "OrderProduct_warehouseId_fkey"
FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
