import Header from '@/components/Header';
import OrdersTable from '@/components/OrdersTable';

export default function Orders() {
  return <><Header /><div className="wrap" style={{ paddingTop: 48 }}><OrdersTable farmer={false} /></div></>;
}
