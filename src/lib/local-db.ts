/**
 * Mock LocalDB implementation using LocalStorage to satisfy the AdvocatePortal interface.
 */
export class LocalDB {
  private static instance: LocalDB;
  private data: Record<string, any[]> = {
    clients: []
  };

  private constructor() {}

  public static getInstance(): LocalDB {
    if (!LocalDB.instance) {
      LocalDB.instance = new LocalDB();
    }
    return LocalDB.instance;
  }

  public async init() {
    const saved = localStorage.getItem('nexus_db');
    if (saved) {
      this.data = JSON.parse(saved);
    }
    return true;
  }

  public query(sql: string): any[] {
    if (sql.toLowerCase().includes('from clients')) {
      return this.data.clients || [];
    }
    return [];
  }

  public run(sql: string, params: any[]) {
    if (sql.toLowerCase().includes('insert into clients')) {
      const [name, phone, case_number, court, next_date, purpose] = params;
      const newClient = {
        id: Date.now(),
        name,
        phone,
        case_number,
        court,
        next_date,
        purpose
      };
      this.data.clients.push(newClient);
      this.persist();
    }
  }

  private persist() {
    localStorage.setItem('nexus_db', JSON.stringify(this.data));
  }
}
