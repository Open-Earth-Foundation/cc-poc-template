import { type User, type InsertUser, type City, type InsertCity, type Boundary, type InsertBoundary, type Session, type InsertSession } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // City methods
  getCities(): Promise<City[]>;
  getCitiesByProjectIds(projectIds: string[]): Promise<City[]>;
  getCity(cityId: string): Promise<City | undefined>;
  createCity(city: InsertCity): Promise<City>;
  createOrUpdateCity(city: InsertCity): Promise<City>;

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

  // OAuth code tracking methods (to prevent "Single-use code" errors)
  isCodeConsumed(code: string): Promise<boolean>;
  markCodeAsConsumed(code: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private cities: Map<string, City>;
  private boundaries: Map<string, Boundary>;
  private sessions: Map<string, Session>;
  private consumedCodes: Set<string>;

  constructor() {
    this.users = new Map();
    this.cities = new Map();
    this.boundaries = new Map();
    this.sessions = new Map();
    this.consumedCodes = new Set();

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
      currentBoundary: {
        type: 'Polygon',
        coordinates: [[
          [-58.5319, -34.5268],
          [-58.3350, -34.5268],
          [-58.3350, -34.7051],
          [-58.5319, -34.7051],
          [-58.5319, -34.5268],
        ]],
      },
      metadata: {
        area: 203.5,
        population: 3075646,
        region: "Capital Federal"
      },
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

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      title: insertUser.title || null,
      projects: insertUser.projects ? (insertUser.projects as string[]).slice() : [],
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
    console.log('🔍 Looking for cities with project IDs:', projectIds);
    const matchingCities = Array.from(this.cities.values()).filter(city =>
      projectIds.includes(city.projectId)
    );
    console.log(`📦 Found ${matchingCities.length} cities in local storage`);

    // If no cities found, create some sample cities for the user's projects
    if (matchingCities.length === 0 && projectIds.length > 0) {
      console.log('🏗️ Creating sample cities for testing...');
      const sampleCities: City[] = [];

      for (let i = 0; i < Math.min(3, projectIds.length); i++) {
        const projectId = projectIds[i];
        const sampleCity: City = {
          id: `sample-city-${i + 1}`,
          cityId: projectId,
          name: `Sample City ${i + 1}`,
          country: 'Sample Country',
          locode: `SC${i + 1}`,
          projectId: projectId,
          currentBoundary: null,
          metadata: { area: 100 + i * 50 },
          createdAt: new Date(),
        };

        this.cities.set(sampleCity.id, sampleCity);
        sampleCities.push(sampleCity);
      }

      console.log(`✅ Created ${sampleCities.length} sample cities`);
      return sampleCities;
    }

    return matchingCities;
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

  async createOrUpdateCity(insertCity: InsertCity): Promise<City> {
    // Check if city with same cityId already exists
    const existing = await this.getCity(insertCity.cityId);
    if (existing) {
      // Update existing city
      const updatedCity: City = {
        ...existing,
        ...insertCity,
        id: existing.id,
        createdAt: existing.createdAt,
        locode: insertCity.locode || null,
        currentBoundary: insertCity.currentBoundary || null,
        metadata: insertCity.metadata || {},
      };
      this.cities.set(existing.id, updatedCity);
      return updatedCity;
    } else {
      // Create new city
      return await this.createCity(insertCity);
    }
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

  async storeOAuthSession(session: {
    state: string;
    codeVerifier: string;
    codeChallenge: string;
    createdAt: Date;
  }): Promise<void> {
    // Clean up old sessions (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [id, session] of this.sessions.entries()) {
      if (session.createdAt && session.createdAt <= oneHourAgo) {
        this.sessions.delete(id);
      }
    }

    // Store new session
    const newSession: Session = {
      id: randomUUID(), // Generate a unique ID for the session
      token: session.state, // Use state as token for lookup
      userId: '', // Will be set later
      codeVerifier: session.codeVerifier,
      state: session.state,
      createdAt: session.createdAt,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiry
    };
    this.sessions.set(newSession.id, newSession);
  }

  async getSessionByState(state: string): Promise<Session | undefined> {
    return Array.from(this.sessions.values()).find(s => s.state === state);
  }

  // OAuth code tracking methods
  async isCodeConsumed(code: string): Promise<boolean> {
    return this.consumedCodes.has(code);
  }

  async markCodeAsConsumed(code: string): Promise<void> {
    this.consumedCodes.add(code);
  }
}

export const storage = new MemStorage();