import { db, isFirebaseConfigured } from '../lib/firebase';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';

import {
  Customer,
  Order,
  Quotation,
  Payment,
  Project,
  Task,
  HostingDomain,
  SupportRequest,
  ServiceItem,
  Handover,
  AppSettings,
  User,
} from '../types';
import { STANDARD_WP_STAGES } from '../lib/utils';

import {
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_SERVICES,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_QUOTATIONS,
  INITIAL_PAYMENTS,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_HOSTING_DOMAINS,
  INITIAL_SUPPORT_REQUESTS,
  INITIAL_HANDOVERS,
} from './seedData';

// Storage keys for local persistence
const STORAGE_KEYS = {
  USERS: 'wp_mgr_users',
  CUSTOMERS: 'wp_mgr_customers',
  SERVICES: 'wp_mgr_services',
  ORDERS: 'wp_mgr_orders',
  QUOTATIONS: 'wp_mgr_quotations',
  PAYMENTS: 'wp_mgr_payments',
  PROJECTS: 'wp_mgr_projects',
  TASKS: 'wp_mgr_tasks',
  HOSTING_DOMAINS: 'wp_mgr_hosting_domains',
  SUPPORT_REQUESTS: 'wp_mgr_support_requests',
  HANDOVERS: 'wp_mgr_handovers',
  SETTINGS: 'wp_mgr_settings',
  INITIALIZED: 'wp_mgr_initialized_v3',
};

// Fast timeout wrapper to ensure zero UI lag (max 1500ms for network calls)
async function withTimeout<T>(promise: Promise<T>, timeoutMs = 1500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), timeoutMs)
    ),
  ]);
}

// Local storage helpers
function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Error writing to localStorage', err);
  }
}

// Initialize database with clean default state (services & settings only, clean empty collections)
export function initializeLocalDatabase(): void {
  const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (!isInit) {
    setLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
    setLocal(STORAGE_KEYS.CUSTOMERS, []);
    setLocal(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    setLocal(STORAGE_KEYS.ORDERS, []);
    setLocal(STORAGE_KEYS.QUOTATIONS, []);
    setLocal(STORAGE_KEYS.PAYMENTS, []);
    setLocal(STORAGE_KEYS.PROJECTS, []);
    setLocal(STORAGE_KEYS.TASKS, []);
    setLocal(STORAGE_KEYS.HOSTING_DOMAINS, []);
    setLocal(STORAGE_KEYS.SUPPORT_REQUESTS, []);
    setLocal(STORAGE_KEYS.HANDOVERS, []);
    setLocal(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    console.log('[Database] Initialized clean local database.');
  }
}

// Clear all data back to 100% clean state
export function clearAllMockData(): void {
  setLocal(STORAGE_KEYS.CUSTOMERS, []);
  setLocal(STORAGE_KEYS.ORDERS, []);
  setLocal(STORAGE_KEYS.QUOTATIONS, []);
  setLocal(STORAGE_KEYS.PAYMENTS, []);
  setLocal(STORAGE_KEYS.PROJECTS, []);
  setLocal(STORAGE_KEYS.TASKS, []);
  setLocal(STORAGE_KEYS.HOSTING_DOMAINS, []);
  setLocal(STORAGE_KEYS.SUPPORT_REQUESTS, []);
  setLocal(STORAGE_KEYS.HANDOVERS, []);
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  console.log('[Database] Cleared all data. System is now completely empty.');
}

// Load demo data if user explicitly wants it
export function populateDemoData(): void {
  setLocal(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  setLocal(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  setLocal(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  setLocal(STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
  setLocal(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  setLocal(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  setLocal(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  setLocal(STORAGE_KEYS.HOSTING_DOMAINS, INITIAL_HOSTING_DOMAINS);
  setLocal(STORAGE_KEYS.SUPPORT_REQUESTS, INITIAL_SUPPORT_REQUESTS);
  setLocal(STORAGE_KEYS.HANDOVERS, INITIAL_HANDOVERS);
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
}

export function resetDatabaseToFactory(): void {
  clearAllMockData();
}

// Seed initial data directly to Cloud Firestore (wp-order-manager)
export async function seedToCloudFirestore(): Promise<void> {
  if (!db) throw new Error('Cloud Firestore chưa được khởi tạo. Vui lòng kiểm tra cấu hình Firebase.');

  try {
    await setDoc(doc(db, 'settings', 'general'), INITIAL_SETTINGS, { merge: true });

    for (const s of INITIAL_SERVICES) {
      await setDoc(doc(db, 'services', s.id), s);
    }

    for (const c of INITIAL_CUSTOMERS) {
      await setDoc(doc(db, 'customers', c.id), c);
    }

    for (const o of INITIAL_ORDERS) {
      await setDoc(doc(db, 'orders', o.id), o);
    }

    for (const q of INITIAL_QUOTATIONS) {
      await setDoc(doc(db, 'quotations', q.id), q);
    }

    for (const p of INITIAL_PAYMENTS) {
      await setDoc(doc(db, 'payments', p.id), p);
    }

    for (const pr of INITIAL_PROJECTS) {
      await setDoc(doc(db, 'projects', pr.id), pr);
    }

    for (const t of INITIAL_TASKS) {
      await setDoc(doc(db, 'tasks', t.id), t);
    }

    for (const hd of INITIAL_HOSTING_DOMAINS) {
      await setDoc(doc(db, 'hosting_domains', hd.id), hd);
    }

    for (const sr of INITIAL_SUPPORT_REQUESTS) {
      await setDoc(doc(db, 'support_requests', sr.id), sr);
    }

    for (const ho of INITIAL_HANDOVERS) {
      await setDoc(doc(db, 'handovers', ho.id), ho);
    }

    for (const u of INITIAL_USERS) {
      await setDoc(doc(db, 'users', u.id), u);
    }

    console.log('[Firebase] Successfully seeded all collections to Cloud Firestore.');
  } catch (err: any) {
    console.error('[Firebase] Seed error (Check Firestore Rules):', err);
    throw new Error(`Lỗi phân quyền Firestore: ${err.message || 'Vui lòng cập nhật Rules trên Firebase Console'}`);
  }
}

// ----------------- USERS REPOSITORY -----------------
export const usersService = {
  async getAll(): Promise<User[]> {
    initializeLocalDatabase();
    if (isFirebaseConfigured && db) {
      try {
        const snap = await withTimeout(getDocs(collection(db, 'users')));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as User));
        setLocal(STORAGE_KEYS.USERS, list);
        return list;
      } catch (err) {
        // Fallback gracefully
      }
    }
    return getLocal<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },

  async getById(id: string): Promise<User | null> {
    const users = await this.getAll();
    return users.find((u) => u.id === id || u.uid === id) || null;
  },

  async create(user: Omit<User, 'id'>): Promise<User> {
    const users = await this.getAll();
    const newUser: User = { id: `user-${Date.now()}`, ...user };
    users.push(newUser);
    setLocal(STORAGE_KEYS.USERS, users);

    if (isFirebaseConfigured && db) {
      addDoc(collection(db, 'users'), user).catch((err) =>
        console.warn('[Firestore] users write warning:', err)
      );
    }
    return newUser;
  },
};

// ----------------- CUSTOMERS REPOSITORY -----------------
export const customersService = {
  async getAll(): Promise<Customer[]> {
    initializeLocalDatabase();
    if (isFirebaseConfigured && db) {
      try {
        const snap = await withTimeout(getDocs(collection(db, 'customers')));
        const serverList = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Customer))
          .filter((c) => !c.isDeleted);
        setLocal(STORAGE_KEYS.CUSTOMERS, serverList);
        return serverList;
      } catch (err) {
        // Fallback to local
      }
    }
    const all = getLocal<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    return all.filter((c) => !c.isDeleted);
  },

  async getById(id: string): Promise<Customer | null> {
    const list = await this.getAll();
    return list.find((c) => c.id === id) || null;
  },

  async create(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>): Promise<Customer> {
    const now = new Date().toISOString();
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      ...data,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    // Save locally immediately
    const all = getLocal<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    all.unshift(newCustomer);
    setLocal(STORAGE_KEYS.CUSTOMERS, all);

    // Sync to Firestore
    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'customers', newCustomer.id), newCustomer).catch((err) =>
        console.warn('[Firestore] customers create warning (Check Firestore Rules):', err)
      );
    }
    return newCustomer;
  },

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    const now = new Date().toISOString();
    const all = getLocal<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const index = all.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Khách hàng không tồn tại');
    all[index] = { ...all[index], ...data, updatedAt: now };
    setLocal(STORAGE_KEYS.CUSTOMERS, all);

    if (isFirebaseConfigured && db) {
      updateDoc(doc(db, 'customers', id), { ...data, updatedAt: now }).catch((err) =>
        console.warn('[Firestore] customers update warning:', err)
      );
    }
    return all[index];
  },

  async softDelete(id: string): Promise<void> {
    const all = getLocal<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const updated = all.map((c) => (c.id === id ? { ...c, isDeleted: true, updatedAt: new Date().toISOString() } : c));
    setLocal(STORAGE_KEYS.CUSTOMERS, updated);

    if (isFirebaseConfigured && db) {
      updateDoc(doc(db, 'customers', id), { isDeleted: true, updatedAt: new Date().toISOString() }).catch((err) =>
        console.warn('[Firestore] customers delete warning:', err)
      );
    }
  },
};

// ----------------- SERVICES REPOSITORY -----------------
export const servicesService = {
  async getAll(): Promise<ServiceItem[]> {
    initializeLocalDatabase();
    if (isFirebaseConfigured && db) {
      try {
        const snap = await withTimeout(getDocs(collection(db, 'services')));
        if (!snap.empty) {
          const serverList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceItem));
          setLocal(STORAGE_KEYS.SERVICES, serverList);
          return serverList;
        }
      } catch (err) {
        // Fallback
      }
    }
    return getLocal<ServiceItem[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  },

  async create(data: Omit<ServiceItem, 'id' | 'createdAt'>): Promise<ServiceItem> {
    const newItem: ServiceItem = {
      id: `srv-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
    const all = await this.getAll();
    all.push(newItem);
    setLocal(STORAGE_KEYS.SERVICES, all);

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'services', newItem.id), newItem).catch((err) =>
        console.warn('[Firestore] services create warning:', err)
      );
    }
    return newItem;
  },

  async update(id: string, data: Partial<ServiceItem>): Promise<ServiceItem> {
    const all = await this.getAll();
    const index = all.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Dịch vụ không tồn tại');
    all[index] = { ...all[index], ...data };
    setLocal(STORAGE_KEYS.SERVICES, all);

    if (isFirebaseConfigured && db) {
      updateDoc(doc(db, 'services', id), data).catch((err) =>
        console.warn('[Firestore] services update warning:', err)
      );
    }
    return all[index];
  },

  async delete(id: string): Promise<void> {
    const all = await this.getAll();
    const filtered = all.filter((s) => s.id !== id);
    setLocal(STORAGE_KEYS.SERVICES, filtered);

    if (isFirebaseConfigured && db) {
      deleteDoc(doc(db, 'services', id)).catch((err) =>
        console.warn('[Firestore] services delete warning:', err)
      );
    }
  },
};

// ----------------- ORDERS REPOSITORY -----------------
export const ordersService = {
  async getAll(): Promise<Order[]> {
    initializeLocalDatabase();
    if (isFirebaseConfigured && db) {
      try {
        const snap = await withTimeout(
          getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')))
        );
        const serverList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
        setLocal(STORAGE_KEYS.ORDERS, serverList);
        return serverList;
      } catch (err) {
        // Fallback
      }
    }
    const local = getLocal<Order[]>(STORAGE_KEYS.ORDERS, []);
    local.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return local;
  },

  async getById(id: string): Promise<Order | null> {
    const orders = await this.getAll();
    return orders.find((o) => o.id === id) || null;
  },

  async getByCustomerId(customerId: string): Promise<Order[]> {
    const orders = await this.getAll();
    return orders.filter((o) => o.customerId === customerId);
  },

  async create(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'paidAmount' | 'remainingAmount'>): Promise<Order> {
    const now = new Date().toISOString();
    const total = data.total || data.subtotal - (data.discount || 0);
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      ...data,
      total,
      paidAmount: 0,
      remainingAmount: total,
      createdAt: now,
      updatedAt: now,
    };

    const all = getLocal<Order[]>(STORAGE_KEYS.ORDERS, []);
    all.unshift(newOrder);
    setLocal(STORAGE_KEYS.ORDERS, all);

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'orders', newOrder.id), newOrder).catch((err) =>
        console.warn('[Firestore] orders create warning:', err)
      );
    }
    return newOrder;
  },

  async update(id: string, data: Partial<Order>): Promise<Order> {
    const now = new Date().toISOString();
    const all = getLocal<Order[]>(STORAGE_KEYS.ORDERS, []);
    const index = all.findIndex((o) => o.id === id);
    if (index === -1) throw new Error('Đơn hàng không tồn tại');
    all[index] = { ...all[index], ...data, updatedAt: now };
    setLocal(STORAGE_KEYS.ORDERS, all);

    if (isFirebaseConfigured && db) {
      updateDoc(doc(db, 'orders', id), { ...data, updatedAt: now }).catch((err) =>
        console.warn('[Firestore] orders update warning:', err)
      );
    }
    return all[index];
  },
};

// ----------------- QUOTATIONS REPOSITORY -----------------
export const quotationsService = {
  async getAll(): Promise<Quotation[]> {
    initializeLocalDatabase();
    if (isFirebaseConfigured && db) {
      try {
        const snap = await withTimeout(
          getDocs(query(collection(db, 'quotations'), orderBy('createdAt', 'desc')))
        );
        const serverList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quotation));
        setLocal(STORAGE_KEYS.QUOTATIONS, serverList);
        return serverList;
      } catch (err) {
        // Fallback
      }
    }
    return getLocal<Quotation[]>(STORAGE_KEYS.QUOTATIONS, []);
  },

  async getById(id: string): Promise<Quotation | null> {
    const all = await this.getAll();
    return all.find((q) => q.id === id) || null;
  },

  async getByCustomerId(customerId: string): Promise<Quotation[]> {
    const all = await this.getAll();
    return all.filter((q) => q.customerId === customerId);
  },

  async create(data: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quotation> {
    const now = new Date().toISOString();
    const newQuote: Quotation = {
      id: `quote-${Date.now()}`,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    const all = getLocal<Quotation[]>(STORAGE_KEYS.QUOTATIONS, []);
    all.unshift(newQuote);
    setLocal(STORAGE_KEYS.QUOTATIONS, all);

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'quotations', newQuote.id), newQuote).catch((err) =>
        console.warn('[Firestore] quotations create warning:', err)
      );
    }
    return newQuote;
  },

  async update(id: string, data: Partial<Quotation>): Promise<Quotation> {
    const now = new Date().toISOString();
    const all = getLocal<Quotation[]>(STORAGE_KEYS.QUOTATIONS, []);
    const index = all.findIndex((q) => q.id === id);
    if (index === -1) throw new Error('Báo giá không tồn tại');
    all[index] = { ...all[index], ...data, updatedAt: now };
    setLocal(STORAGE_KEYS.QUOTATIONS, all);

    if (isFirebaseConfigured && db) {
      updateDoc(doc(db, 'quotations', id), { ...data, updatedAt: now }).catch((err) =>
        console.warn('[Firestore] quotations update warning:', err)
      );
    }
    return all[index];
  },

  async convertToOrder(quotationId: string, orderTitle?: string): Promise<Order> {
    const quotation = await this.getById(quotationId);
    if (!quotation) throw new Error('Báo giá không tồn tại');

    const customer = await customersService.getById(quotation.customerId);
    const existingOrders = await ordersService.getAll();
    const orderCode = `WP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(existingOrders.length + 1).padStart(4, '0')}`;

    const newOrder = await ordersService.create({
      orderCode,
      customerId: quotation.customerId,
      customerName: customer?.name || '',
      customerPhone: customer?.phone || '',
      customerEmail: customer?.email || '',
      title: orderTitle || quotation.title,
      websiteType: 'Doanh nghiệp',
      items: quotation.items,
      subtotal: quotation.subtotal,
      discount: quotation.discount,
      total: quotation.total,
      status: 'pending_confirm',
      startDate: new Date().toISOString().split('T')[0],
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      note: `Chuyển đổi từ báo giá ${quotation.quotationCode}`,
    });

    await this.update(quotationId, {
      status: 'converted',
      orderId: newOrder.id,
    });

    return newOrder;
  },
};

// ----------------- PAYMENTS REPOSITORY -----------------
export const paymentsService = {
  async getAll(): Promise<Payment[]> {
    initializeLocalDatabase();
    if (isFirebaseConfigured && db) {
      try {
        const snap = await withTimeout(
          getDocs(query(collection(db, 'payments'), orderBy('createdAt', 'desc')))
        );
        const serverList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Payment));
        setLocal(STORAGE_KEYS.PAYMENTS, serverList);
        return serverList;
      } catch (err) {
        // Fallback
      }
    }
    return getLocal<Payment[]>(STORAGE_KEYS.PAYMENTS, []);
  },

  async getByOrderId(orderId: string): Promise<Payment[]> {
    const all = await this.getAll();
    return all.filter((p) => p.orderId === orderId);
  },

  async getByCustomerId(customerId: string): Promise<Payment[]> {
    const all = await this.getAll();
    return all.filter((p) => p.customerId === customerId);
  },

  async addPayment(data: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
    const now = new Date().toISOString();
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      ...data,
      createdAt: now,
    };

    const all = getLocal<Payment[]>(STORAGE_KEYS.PAYMENTS, []);
    all.unshift(newPayment);
    setLocal(STORAGE_KEYS.PAYMENTS, all);

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'payments', newPayment.id), newPayment).catch((err) =>
        console.warn('[Firestore] payments add warning:', err)
      );
    }

    // Recalculate order payment totals
    const order = await ordersService.getById(data.orderId);
    if (order) {
      const orderPayments = await this.getByOrderId(data.orderId);
      const totalPaid = orderPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const remaining = Math.max(0, order.total - totalPaid);

      let newStatus = order.status;
      if (totalPaid >= order.total) {
        newStatus = order.status === 'in_progress' ? 'in_progress' : 'paid';
      } else if (totalPaid > 0 && order.status === 'pending_confirm') {
        newStatus = 'deposited';
      }

      await ordersService.update(order.id, {
        paidAmount: totalPaid,
        remainingAmount: remaining,
        status: newStatus,
      });
    }

    return newPayment;
  },
};

// ----------------- PROJECTS REPOSITORY -----------------
export const projectsService = {
  async getAll(): Promise<Project[]> {
    initializeLocalDatabase();
    if (isFirebaseConfigured && db) {
      try {
        const snap = await withTimeout(getDocs(collection(db, 'projects')));
        const serverList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
        setLocal(STORAGE_KEYS.PROJECTS, serverList);
        return serverList;
      } catch (err) {
        // Fallback
      }
    }
    return getLocal<Project[]>(STORAGE_KEYS.PROJECTS, []);
  },

  async getById(id: string): Promise<Project | null> {
    const all = await this.getAll();
    return all.find((p) => p.id === id) || null;
  },

  async getByOrderId(orderId: string): Promise<Project | null> {
    const all = await this.getAll();
    return all.find((p) => p.orderId === orderId) || null;
  },

  async getByCustomerId(customerId: string): Promise<Project[]> {
    const all = await this.getAll();
    return all.filter((p) => p.customerId === customerId);
  },

  async create(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'stages' | 'currentStage'>): Promise<Project> {
    const now = new Date().toISOString();
    const stages = STANDARD_WP_STAGES.map((s) => ({
      ...s,
      completed: s.id === 1,
      completedAt: s.id === 1 ? now : undefined,
    }));

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      ...data,
      progress: Math.round((1 / 11) * 100),
      currentStage: 1,
      stages,
      createdAt: now,
      updatedAt: now,
    };

    const all = getLocal<Project[]>(STORAGE_KEYS.PROJECTS, []);
    all.unshift(newProject);
    setLocal(STORAGE_KEYS.PROJECTS, all);

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'projects', newProject.id), newProject).catch((err) =>
        console.warn('[Firestore] projects create warning:', err)
      );
    }

    // Link project to order
    await ordersService.update(data.orderId, { projectId: newProject.id, status: 'in_progress' });
    return newProject;
  },

  async updateStage(projectId: string, stageId: number, completed: boolean, note?: string): Promise<Project> {
    const project = await this.getById(projectId);
    if (!project) throw new Error('Dự án không tồn tại');

    const updatedStages = project.stages.map((s) => {
      if (s.id === stageId) {
        return {
          ...s,
          completed,
          completedAt: completed ? new Date().toISOString() : undefined,
          note: note !== undefined ? note : s.note,
        };
      }
      return s;
    });

    const completedCount = updatedStages.filter((s) => s.completed).length;
    const progress = Math.round((completedCount / updatedStages.length) * 100);
    const currentStage = Math.min(11, completedCount + 1);

    const updated = await this.update(projectId, {
      stages: updatedStages,
      progress,
      currentStage,
      status: progress === 100 ? 'completed' : project.status,
    });

    return updated;
  },

  async update(id: string, data: Partial<Project>): Promise<Project> {
    const now = new Date().toISOString();
    const all = getLocal<Project[]>(STORAGE_KEYS.PROJECTS, []);
    const index = all.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Dự án không tồn tại');
    all[index] = { ...all[index], ...data, updatedAt: now };
    setLocal(STORAGE_KEYS.PROJECTS, all);

    if (isFirebaseConfigured && db) {
      updateDoc(doc(db, 'projects', id), { ...data, updatedAt: now }).catch((err) =>
        console.warn('[Firestore] projects update warning:', err)
      );
    }
    return all[index];
  },
};

// ----------------- TASKS REPOSITORY -----------------
export const tasksService = {
  async getAll(): Promise<Task[]> {
    initializeLocalDatabase();
    if (isFirebaseConfigured && db) {
      try {
        const snap = await withTimeout(getDocs(collection(db, 'tasks')));
        const serverList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
        setLocal(STORAGE_KEYS.TASKS, serverList);
        return serverList;
      } catch (err) {
        // Fallback
      }
    }
    return getLocal<Task[]>(STORAGE_KEYS.TASKS, []);
  },

  async getByProjectId(projectId: string): Promise<Task[]> {
    const all = await this.getAll();
    return all.filter((t) => t.projectId === projectId);
  },

  async getCustomerVisibleTasks(projectId: string): Promise<Task[]> {
    const all = await this.getByProjectId(projectId);
    return all.filter((t) => t.visibleToCustomer);
  },

  async createTask(data: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    return this.create(data);
  },

  async create(data: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
    const all = getLocal<Task[]>(STORAGE_KEYS.TASKS, []);
    all.unshift(newTask);
    setLocal(STORAGE_KEYS.TASKS, all);

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'tasks', newTask.id), newTask).catch((err) =>
        console.warn('[Firestore] tasks create warning:', err)
      );
    }
    return newTask;
  },

  async update(id: string, data: Partial<Task>): Promise<Task> {
    if (data.status === 'done' && !data.completedAt) {
      data.completedAt = new Date().toISOString();
    }
    const all = getLocal<Task[]>(STORAGE_KEYS.TASKS, []);
    const index = all.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Công việc không tồn tại');
    all[index] = { ...all[index], ...data };
    setLocal(STORAGE_KEYS.TASKS, all);

    if (isFirebaseConfigured && db) {
      updateDoc(doc(db, 'tasks', id), data).catch((err) =>
        console.warn('[Firestore] tasks update warning:', err)
      );
    }
    return all[index];
  },

  async delete(id: string): Promise<void> {
    const all = getLocal<Task[]>(STORAGE_KEYS.TASKS, []);
    const filtered = all.filter((t) => t.id !== id);
    setLocal(STORAGE_KEYS.TASKS, filtered);

    if (isFirebaseConfigured && db) {
      deleteDoc(doc(db, 'tasks', id)).catch((err) =>
        console.warn('[Firestore] tasks delete warning:', err)
      );
    }
  },
};

// ----------------- HOSTING & DOMAINS REPOSITORY -----------------
export const hostingDomainsService = {
  async getAll(): Promise<HostingDomain[]> {
    initializeLocalDatabase();
    if (isFirebaseConfigured && db) {
      try {
        const snap = await withTimeout(getDocs(collection(db, 'hosting_domains')));
        const serverList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as HostingDomain));
        setLocal(STORAGE_KEYS.HOSTING_DOMAINS, serverList);
        return serverList;
      } catch (err) {
        // Fallback
      }
    }
    return getLocal<HostingDomain[]>(STORAGE_KEYS.HOSTING_DOMAINS, []);
  },

  async getByCustomerId(customerId: string): Promise<HostingDomain[]> {
    const all = await this.getAll();
    return all.filter((h) => h.customerId === customerId);
  },

  async create(data: Omit<HostingDomain, 'id' | 'createdAt' | 'updatedAt'>): Promise<HostingDomain> {
    const now = new Date().toISOString();
    const newRecord: HostingDomain = {
      id: `hd-${Date.now()}`,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    const all = getLocal<HostingDomain[]>(STORAGE_KEYS.HOSTING_DOMAINS, []);
    all.unshift(newRecord);
    setLocal(STORAGE_KEYS.HOSTING_DOMAINS, all);

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'hosting_domains', newRecord.id), newRecord).catch((err) =>
        console.warn('[Firestore] hosting_domains create warning:', err)
      );
    }
    return newRecord;
  },

  async update(id: string, data: Partial<HostingDomain>): Promise<HostingDomain> {
    const now = new Date().toISOString();
    const all = getLocal<HostingDomain[]>(STORAGE_KEYS.HOSTING_DOMAINS, []);
    const index = all.findIndex((h) => h.id === id);
    if (index === -1) throw new Error('Bản ghi không tồn tại');
    all[index] = { ...all[index], ...data, updatedAt: now };
    setLocal(STORAGE_KEYS.HOSTING_DOMAINS, all);

    if (isFirebaseConfigured && db) {
      updateDoc(doc(db, 'hosting_domains', id), { ...data, updatedAt: now }).catch((err) =>
        console.warn('[Firestore] hosting_domains update warning:', err)
      );
    }
    return all[index];
  },
};

// ----------------- SUPPORT REQUESTS REPOSITORY -----------------
export const supportRequestsService = {
  async getAll(): Promise<SupportRequest[]> {
    initializeLocalDatabase();
    if (isFirebaseConfigured && db) {
      try {
        const snap = await withTimeout(
          getDocs(query(collection(db, 'support_requests'), orderBy('createdAt', 'desc')))
        );
        const serverList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SupportRequest));
        setLocal(STORAGE_KEYS.SUPPORT_REQUESTS, serverList);
        return serverList;
      } catch (err) {
        // Fallback
      }
    }
    return getLocal<SupportRequest[]>(STORAGE_KEYS.SUPPORT_REQUESTS, []);
  },

  async getByCustomerId(customerId: string): Promise<SupportRequest[]> {
    const all = await this.getAll();
    return all.filter((s) => s.customerId === customerId);
  },

  async create(data: Omit<SupportRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<SupportRequest> {
    const now = new Date().toISOString();
    const newReq: SupportRequest = {
      id: `sr-${Date.now()}`,
      ...data,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    };
    const all = getLocal<SupportRequest[]>(STORAGE_KEYS.SUPPORT_REQUESTS, []);
    all.unshift(newReq);
    setLocal(STORAGE_KEYS.SUPPORT_REQUESTS, all);

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'support_requests', newReq.id), newReq).catch((err) =>
        console.warn('[Firestore] support_requests create warning:', err)
      );
    }
    return newReq;
  },

  async update(id: string, data: Partial<SupportRequest>): Promise<SupportRequest> {
    const now = new Date().toISOString();
    const all = getLocal<SupportRequest[]>(STORAGE_KEYS.SUPPORT_REQUESTS, []);
    const index = all.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Yêu cầu không tồn tại');
    all[index] = { ...all[index], ...data, updatedAt: now };
    setLocal(STORAGE_KEYS.SUPPORT_REQUESTS, all);

    if (isFirebaseConfigured && db) {
      updateDoc(doc(db, 'support_requests', id), { ...data, updatedAt: now }).catch((err) =>
        console.warn('[Firestore] support_requests update warning:', err)
      );
    }
    return all[index];
  },
};

// ----------------- HANDOVERS REPOSITORY -----------------
export const handoversService = {
  async getAll(): Promise<Handover[]> {
    initializeLocalDatabase();
    if (isFirebaseConfigured && db) {
      try {
        const snap = await withTimeout(getDocs(collection(db, 'handovers')));
        const serverList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Handover));
        setLocal(STORAGE_KEYS.HANDOVERS, serverList);
        return serverList;
      } catch (err) {
        // Fallback
      }
    }
    return getLocal<Handover[]>(STORAGE_KEYS.HANDOVERS, []);
  },

  async getByOrderId(orderId: string): Promise<Handover | null> {
    const all = await this.getAll();
    return all.find((h) => h.orderId === orderId) || null;
  },

  async create(data: Omit<Handover, 'id' | 'createdAt' | 'updatedAt'>): Promise<Handover> {
    const now = new Date().toISOString();
    const newHandover: Handover = {
      id: `ho-${Date.now()}`,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    const all = getLocal<Handover[]>(STORAGE_KEYS.HANDOVERS, []);
    all.unshift(newHandover);
    setLocal(STORAGE_KEYS.HANDOVERS, all);

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'handovers', newHandover.id), newHandover).catch((err) =>
        console.warn('[Firestore] handovers create warning:', err)
      );
    }
    return newHandover;
  },

  async update(id: string, data: Partial<Handover>): Promise<Handover> {
    const now = new Date().toISOString();
    const all = getLocal<Handover[]>(STORAGE_KEYS.HANDOVERS, []);
    const index = all.findIndex((h) => h.id === id);
    if (index === -1) throw new Error('Bàn giao không tồn tại');
    all[index] = { ...all[index], ...data, updatedAt: now };
    setLocal(STORAGE_KEYS.HANDOVERS, all);

    if (isFirebaseConfigured && db) {
      updateDoc(doc(db, 'handovers', id), { ...data, updatedAt: now }).catch((err) =>
        console.warn('[Firestore] handovers update warning:', err)
      );
    }
    return all[index];
  },
};

// ----------------- SETTINGS REPOSITORY -----------------
export const settingsService = {
  async get(): Promise<AppSettings> {
    initializeLocalDatabase();
    if (isFirebaseConfigured && db) {
      try {
        const snap = await withTimeout(getDoc(doc(db, 'settings', 'general')));
        if (snap.exists()) {
          const serverData = snap.data() as AppSettings;
          setLocal(STORAGE_KEYS.SETTINGS, serverData);
          return serverData;
        }
      } catch (err) {
        // Fallback
      }
    }
    return getLocal<AppSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  },

  async update(data: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.get();
    const updated = { ...current, ...data };
    setLocal(STORAGE_KEYS.SETTINGS, updated);

    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'settings', 'general'), updated, { merge: true }).catch((err) =>
        console.warn('[Firestore] settings update warning:', err)
      );
    }
    return updated;
  },
};
