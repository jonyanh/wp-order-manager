import { HostingDomain, Order, Task, Quotation } from '../types';

export interface SystemAlert {
  id: string;
  type: 'domain' | 'hosting' | 'ssl' | 'order_deadline' | 'task_deadline' | 'quotation_expiry';
  title: string;
  subtitle: string;
  targetName: string;
  daysLeft: number;
  expiryDate: string;
  severity: 'danger' | 'warning' | 'info'; // danger: <=0, warning: <=7, info: <=30
  link: string;
}

export function calculateDaysLeft(dateStr?: string): number {
  if (!dateStr) return 999;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return 999;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function generateSystemAlerts(params: {
  hostingDomains?: HostingDomain[];
  orders?: Order[];
  tasks?: Task[];
  quotations?: Quotation[];
}): SystemAlert[] {
  const alerts: SystemAlert[] = [];

  // 1. TÊN MIỀN (Domain Expiry)
  (params.hostingDomains || []).forEach((item) => {
    if (item.domainExpiry) {
      const days = calculateDaysLeft(item.domainExpiry);
      if (days <= 30) {
        let severity: 'danger' | 'warning' | 'info' = 'info';
        let subtitle = `Hết hạn sau ${days} ngày (${item.domainExpiry})`;

        if (days < 0) {
          severity = 'danger';
          subtitle = `Đã quá hạn ${Math.abs(days)} ngày (${item.domainExpiry})`;
        } else if (days === 0) {
          severity = 'danger';
          subtitle = `Hết hạn hôm nay! (${item.domainExpiry})`;
        } else if (days <= 7) {
          severity = 'warning';
          subtitle = `Khẩn cấp: Hết hạn sau ${days} ngày (${item.domainExpiry})`;
        }

        alerts.push({
          id: `domain-${item.id}`,
          type: 'domain',
          title: `Tên miền: ${item.domain}`,
          subtitle,
          targetName: item.domain,
          daysLeft: days,
          expiryDate: item.domainExpiry,
          severity,
          link: '/admin/hosting-domains',
        });
      }
    }

    // 2. HOSTING (Hosting Expiry)
    if (item.hostingExpiry) {
      const days = calculateDaysLeft(item.hostingExpiry);
      if (days <= 30) {
        let severity: 'danger' | 'warning' | 'info' = 'info';
        let subtitle = `Hết hạn sau ${days} ngày (${item.hostingExpiry})`;

        if (days < 0) {
          severity = 'danger';
          subtitle = `Hosting đã quá hạn ${Math.abs(days)} ngày (${item.hostingExpiry})`;
        } else if (days === 0) {
          severity = 'danger';
          subtitle = `Hosting hết hạn hôm nay! (${item.hostingExpiry})`;
        } else if (days <= 7) {
          severity = 'warning';
          subtitle = `Khẩn cấp: Hosting hết hạn sau ${days} ngày (${item.hostingExpiry})`;
        }

        alerts.push({
          id: `hosting-${item.id}`,
          type: 'hosting',
          title: `Hosting gói: ${item.hostingProvider} (${item.domain})`,
          subtitle,
          targetName: item.domain,
          daysLeft: days,
          expiryDate: item.hostingExpiry,
          severity,
          link: '/admin/hosting-domains',
        });
      }
    }

    // 3. CHỨNG CHỈ SSL (SSL Expiry)
    if (item.sslExpiry) {
      const days = calculateDaysLeft(item.sslExpiry);
      if (days <= 15) {
        alerts.push({
          id: `ssl-${item.id}`,
          type: 'ssl',
          title: `Chứng chỉ SSL: ${item.domain}`,
          subtitle: days < 0 ? `SSL đã quá hạn ${Math.abs(days)} ngày` : `SSL hết hạn sau ${days} ngày`,
          targetName: item.domain,
          daysLeft: days,
          expiryDate: item.sslExpiry,
          severity: days <= 3 ? 'danger' : 'warning',
          link: '/admin/hosting-domains',
        });
      }
    }
  });

  // 4. HẠN CHÓT ĐƠN HÀNG (Order Deadline)
  (params.orders || []).forEach((order) => {
    if (order.status !== 'completed' && order.status !== 'cancelled' && order.deadline) {
      const days = calculateDaysLeft(order.deadline);
      if (days <= 7) {
        let severity: 'danger' | 'warning' | 'info' = 'warning';
        let subtitle = `Hạn bàn giao còn ${days} ngày (${order.deadline})`;

        if (days < 0) {
          severity = 'danger';
          subtitle = `Đơn hàng đã trễ hạn ${Math.abs(days)} ngày! (${order.deadline})`;
        } else if (days === 0) {
          severity = 'danger';
          subtitle = `Hạn bàn giao đơn hàng là hôm nay! (${order.deadline})`;
        }

        alerts.push({
          id: `order-${order.id}`,
          type: 'order_deadline',
          title: `Deadline đơn hàng: ${order.orderCode} - ${order.title}`,
          subtitle,
          targetName: order.orderCode,
          daysLeft: days,
          expiryDate: order.deadline,
          severity,
          link: `/admin/orders/${order.id}`,
        });
      }
    }
  });

  // 5. CÔNG VIỆC SẮP ĐẾN HẠN (Task Deadline)
  (params.tasks || []).forEach((task) => {
    if (task.status !== 'done' && task.deadline) {
      const days = calculateDaysLeft(task.deadline);
      if (days <= 3) {
        alerts.push({
          id: `task-${task.id}`,
          type: 'task_deadline',
          title: `Công việc: ${task.title}`,
          subtitle: days < 0 ? `Đã quá hạn ${Math.abs(days)} ngày` : `Hạn chót còn ${days} ngày`,
          targetName: task.title,
          daysLeft: days,
          expiryDate: task.deadline,
          severity: days <= 0 ? 'danger' : 'warning',
          link: '/admin/tasks',
        });
      }
    }
  });

  // 6. BÁO GIÁ HIỆU LỰC (Quotation Validity)
  (params.quotations || []).forEach((quote) => {
    if ((quote.status === 'sent' || quote.status === 'draft') && quote.validUntil) {
      const days = calculateDaysLeft(quote.validUntil);
      if (days <= 5) {
        alerts.push({
          id: `quote-${quote.id}`,
          type: 'quotation_expiry',
          title: `Báo giá: ${quote.quotationCode} - ${quote.title}`,
          subtitle: days < 0 ? `Báo giá đã hết hiệu lực ${Math.abs(days)} ngày` : `Hiệu lực còn ${days} ngày`,
          targetName: quote.quotationCode,
          daysLeft: days,
          expiryDate: quote.validUntil,
          severity: days <= 1 ? 'danger' : 'info',
          link: `/admin/quotations/${quote.id}`,
        });
      }
    }
  });

  // Sắp xếp: Khẩn cấp nhất (ít ngày nhất hoặc âm nhiều nhất) lên đầu
  alerts.sort((a, b) => a.daysLeft - b.daysLeft);

  return alerts;
}
