import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import FileStore from 'session-file-store';
import bcrypt from 'bcrypt';
import { type Express, type Request, type Response, type NextFunction } from 'express';
import { User, MONGODB_URI, isMongoDBConnected } from './db';

const FileStoreSession = FileStore(session);

// Password hashing using bcrypt with salt rounds
const SALT_ROUNDS = 10;

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

// Passport serialization
passport.serializeUser((user: any, done) => {
  done(null, user._id.toString());
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findOne({ _id: id });
    if (user) {
      // Remove password from user object
      const { password, ...userWithoutPassword } = user as any;
      done(null, userWithoutPassword);
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error);
  }
});

// Local strategy for email/password authentication
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });

        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Use bcrypt to verify password
        const isPasswordValid = verifyPassword(password, user.password);
        if (!isPasswordValid) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

export async function setupAuth(app: Express) {
  const SESSION_SECRET = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';

  // Only set up MongoDB session store if connected
  if (isMongoDBConnected()) {
    app.use(
      session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
          mongoUrl: MONGODB_URI,
          touchAfter: 24 * 3600, // Lazy update session (once per 24h)
        }),
        cookie: {
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        },
      })
    );
  } else {
    // Use file-based session store for NeDB
    console.log('✅ Using file-based session store (NeDB mode)');
    app.use(
      session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: new FileStoreSession({
          path: './data/sessions',
          ttl: 7 * 24 * 60 * 60, // 7 days in seconds
          retries: 0,
        }),
        cookie: {
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        },
      })
    );
  }

  app.use(passport.initialize());
  app.use(passport.session());

  // Create default admin user (works with both NeDB and MongoDB)
  try {
    const adminEmail = 'admin@quillyourdream.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      // Different passwords for MongoDB vs NeDB for security
      const defaultPassword = isMongoDBConnected() ? 'BlueGrass20!' : 'admin123';
      
      if (isMongoDBConnected()) {
        // MongoDB: use Mongoose model
        const admin = new User({
          email: adminEmail,
          password: hashPassword(defaultPassword),
          role: 'admin',
        });
        await admin.save();
        console.log('✅ Default admin user created (MongoDB)');
        console.log('   Email: admin@quillyourdream.com');
        console.log('   Password: BlueGrass20!');
        console.log('   ⚠️  Change this password immediately!');
      } else {
        // NeDB: Admin user already created during NeDB initialization
        console.log('✅ Admin user managed by NeDB database service');
        console.log('   Email: admin@quillyourdream.com');
        console.log('   Password: admin123');
      }
    }
  } catch (error) {
    console.error('⚠️  Could not verify admin user:', error instanceof Error ? error.message : error);
  }

  // Login route
  app.post('/api/login', (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: 'Authentication error' });
      }

      if (!user) {
        return res.status(401).json({ message: info?.message || 'Invalid credentials' });
      }

      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Login failed' });
        }

        const userResponse = {
          _id: user._id,
          email: user.email,
          role: user.role,
        };

        return res.json({ user: userResponse });
      });
    })(req, res, next);
  });

  // Logout route
  app.post('/api/logout', (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

// Middleware to check if user is admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && (req.user as any)?.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Forbidden - Admin access required' });
}
