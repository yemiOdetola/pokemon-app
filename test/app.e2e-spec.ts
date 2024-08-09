import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as pactum from 'pactum';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthDto, SignupDto } from 'src/auth/dto';
import { ToggleFavoriteDto } from 'src/pokemon/dto/query-pokemon.dto';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    await app.init();
    await app.listen(4444);
    prisma = app.get(PrismaService);
    pactum.request.setBaseUrl('http://localhost:4444');
  });

  afterAll(async () => {
    app.close();
  });

  describe('Data generation and imports', () => {
    describe('Users and organization', () => {
      it('should generate organizations', async () => {
        const organizations = await prisma.organization.findMany();
        expect(organizations.length).toBeGreaterThan(0);
        expect(organizations[0]).toHaveProperty('name');
      });

      it('should generate users for each organization', async () => {
        const organizations = await prisma.organization.findMany();
        for (const org of organizations) {
          const users = await prisma.user.findMany({
            where: { organizationId: org.id },
          });
          expect(users.length).toBeGreaterThan(0);
          expect(users[0]).toHaveProperty('email');
          expect(users[0].email).toContain(org.name);
        }
      });

      it('should hash user passwords', async () => {
        const user = await prisma.user.findFirst();
        expect(user.password).not.toBe('password123');
        expect(user.password.length).toBeGreaterThan(20); // Assuming bcrypt hash
      });
    });
    describe('Pokemon imports', () => {
      it('should import Pokemon data', async () => {
        const pokemon = await prisma.pokemon.findMany();
        expect(pokemon.length).toBeGreaterThan(0);
      });

      it('should assign Pokemon to organizations', async () => {
        const pokemon = await prisma.pokemon.findMany({
          include: { organization: true },
        });
        expect(pokemon[0].organization).toBeDefined();
        expect(pokemon[0].organization.id).toBeDefined();
      });

      it('should import correct Pokemon data', async () => {
        const pikachu = await prisma.pokemon.findUnique({
          where: { name: 'pikachu' },
        });
        expect(pikachu).toBeDefined();
        expect(pikachu.weight).toBeDefined();
        expect(pikachu.sprites).toBeDefined();
      });

      it('should filter sprites correctly', async () => {
        const pokemon = await prisma.pokemon.findFirst();
        expect(pokemon.sprites).not.toHaveProperty('versions');
        expect(pokemon.sprites).toHaveProperty('front_default');
      });
    });
  });

  describe('Auth', () => {
    const payload: AuthDto = {
      email: 'yemyem@gmail.com',
      password: 'password',
    };
    const signupPayload: SignupDto = {
      ...payload,
      organizationId: 1,
    };
    describe('Sign up', () => {
      it('should throw error if email is empty up', () => {
        return pactum
          .spec()
          .post(`/auth/signup`)
          .withBody({ password: payload.password })
          .expectStatus(400);
      });
      it('should throw error if organizationId is empty', () => {
        return pactum
          .spec()
          .post(`/auth/signup`)
          .withBody({ email: payload.email, password: payload.password })
          .expectStatus(400);
      });

      it('should sign up successfully', () => {
        return pactum
          .spec()
          .post(`/auth/signup`)
          .withBody(signupPayload)
          .expectStatus(201)
          .stores('userAt', 'access_token');
      });
    });
    describe('Sign in', () => {
      it('should throw error if email is empty', () => {
        return pactum
          .spec()
          .post(`/auth/signin`)
          .withBody({ password: payload.password })
          .expectStatus(400);
      });

      it('should throw error if password is empty', () => {
        return pactum
          .spec()
          .post(`/auth/signin`)
          .withBody({ email: payload.email })
          .expectStatus(400);
      });

      it('should throw error if email does not exist', () => {
        return pactum
          .spec()
          .post(`/auth/signin`)
          .withBody({
            email: 'nonexistent@gmail.com',
            password: payload.password,
          })
          .expectStatus(403)
          .expectBodyContains('Credentials incorrect');
      });

      it('should throw error if password is incorrect', () => {
        return pactum
          .spec()
          .post(`/auth/signin`)
          .withBody({ email: payload.email, password: 'wrongpassword' })
          .expectStatus(403)
          .expectBodyContains('Credentials incorrect');
      });

      it('should sign in successfully', () => {
        return pactum
          .spec()
          .post(`/auth/signin`)
          .withBody(payload)
          .expectStatus(201)
          .stores('userAt', 'access_token');
      });
    });
  });

  describe('User', () => {
    it('should return a specific user by ID', async () => {
      return pactum
        .spec()
        .get(`/users/1`)
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(200)
        .expectJson({
          id: 1,
          email: 'user1@organization1.com',
          organizationId: 1,
        });
    });

    it('should return 500, if id not found', async () => {
      return pactum
        .spec()
        .get(`/users/999`) // Assuming this ID does not exist
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(500);
    });

    it('should be protected by JWT guard', async () => {
      return pactum.spec().get(`/users/1`).expectStatus(401);
    });
  });

  describe('Pokemon', () => {
    it('GET /pokemons/:organizationId/all - should return pokemons for an organization', async () => {
      await pactum
        .spec()
        .get('/pokemons/1/all') //organization ID hardcoded here
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(200);
    });

    it('GET /pokemons/:id - should return a single pokemon', async () => {
      await pactum
        .spec()
        .get(`/pokemons/1`)
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(200);
    });
  });
});
