export type Item = { id: string; name: string; stock: number; price: number; img: string };

export type OrderRow = {
  orderId: string; productId: string; item: string; qty: number; price: number;
  total: number; pay: string; status: string; date: string;
};

export type GroupedOrder = {
  id: string; lines: OrderRow[]; total: number; pay: string; status: string; date: string;
};
