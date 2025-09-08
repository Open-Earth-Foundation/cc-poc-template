import { type User, type InsertUser, type City, type InsertCity, type Boundary, type InsertBoundary, type Session, type InsertSession } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // City methods
  getCities(): Promise<City[]>;
  getCitiesByProjectIds(projectIds: string[]): Promise<City[]>;
  getCity(cityId: string): Promise<City | undefined>;
  createCity(city: InsertCity): Promise<City>;

  // Boundary methods
  getBoundariesByCityId(cityId: string): Promise<Boundary[]>;
  getBoundary(id: string): Promise<Boundary | undefined>;
  createBoundary(boundary: InsertBoundary): Promise<Boundary>;
  updateBoundary(id: string, updates: Partial<Boundary>): Promise<Boundary | undefined>;
  deleteBoundariesByCityId(cityId: string): Promise<void>;

  // Session methods
  getSession(id: string): Promise<Session | undefined>;
  getSessionByToken(token: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined>;
  deleteSession(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private cities: Map<string, City>;
  private boundaries: Map<string, Boundary>;
  private sessions: Map<string, Session>;

  constructor() {
    this.users = new Map();
    this.cities = new Map();
    this.boundaries = new Map();
    this.sessions = new Map();
    
    // Initialize with sample data for Ciudad Autónoma de Buenos Aires
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleCity: City = {
      id: randomUUID(),
      cityId: "city-buenos-aires",
      name: "Ciudad Autónoma de Buenos Aires",
      country: "Argentina",
      locode: "AR_BAI",
      projectId: "project-south-america",
      currentBoundary: null,
      metadata: {},
      createdAt: new Date(),
    };
    this.cities.set(sampleCity.id, sampleCity);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      title: insertUser.title || null,
      projects: insertUser.projects ? insertUser.projects.slice() : [],
      accessToken: insertUser.accessToken || null,
      refreshToken: insertUser.refreshToken || null,
      tokenExpiry: insertUser.tokenExpiry || null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // City methods
  async getCities(): Promise<City[]> {
    return Array.from(this.cities.values());
  }

  async getCitiesByProjectIds(projectIds: string[]): Promise<City[]> {
    return Array.from(this.cities.values()).filter(city => 
      projectIds.includes(city.projectId)
    );
  }

  async getCity(cityId: string): Promise<City | undefined> {
    return Array.from(this.cities.values()).find(city => city.cityId === cityId);
  }

  async createCity(insertCity: InsertCity): Promise<City> {
    const id = randomUUID();
    const city: City = { 
      ...insertCity, 
      id,
      locode: insertCity.locode || null,
      currentBoundary: insertCity.currentBoundary || null,
      metadata: insertCity.metadata || {},
      createdAt: new Date(),
    };
    this.cities.set(id, city);
    return city;
  }

  // Boundary methods
  async getBoundariesByCityId(cityId: string): Promise<Boundary[]> {
    return Array.from(this.boundaries.values()).filter(boundary => 
      boundary.cityId === cityId
    );
  }

  async getBoundary(id: string): Promise<Boundary | undefined> {
    return this.boundaries.get(id);
  }

  async createBoundary(insertBoundary: InsertBoundary): Promise<Boundary> {
    const id = randomUUID();
    const boundary: Boundary = { 
      ...insertBoundary, 
      id,
      adminLevel: insertBoundary.adminLevel || null,
      boundaryType: insertBoundary.boundaryType || null,
      area: insertBoundary.area || null,
      tags: insertBoundary.tags || {},
      score: insertBoundary.score || null,
      isSelected: insertBoundary.isSelected || false,
      createdAt: new Date(),
    };
    this.boundaries.set(id, boundary);
    return boundary;
  }

  async updateBoundary(id: string, updates: Partial<Boundary>): Promise<Boundary | undefined> {
    const boundary = this.boundaries.get(id);
    if (!boundary) return undefined;
    
    const updatedBoundary = { ...boundary, ...updates };
    this.boundaries.set(id, updatedBoundary);
    return updatedBoundary;
  }

  async deleteBoundariesByCityId(cityId: string): Promise<void> {
    const boundariesArray = Array.from(this.boundaries.entries());
    for (const [id, boundary] of boundariesArray) {
      if (boundary.cityId === cityId) {
        this.boundaries.delete(id);
      }
    }
  }

  // Session methods
  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    return Array.from(this.sessions.values()).find(session => session.token === token);
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = randomUUID();
    const session: Session = { 
      ...insertSession, 
      id,
      codeVerifier: insertSession.codeVerifier || null,
      state: insertSession.state || null,
      createdAt: new Date(),
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async deleteSession(id: string): Promise<void> {
    this.sessions.delete(id);
  }
}

export const storage = new MemStorage();
