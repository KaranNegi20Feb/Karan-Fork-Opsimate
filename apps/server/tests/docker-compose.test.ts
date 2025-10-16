import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

describe('docker-compose.yml Configuration Validation', () => {
    let composeConfig: any;
    const composeFilePath = path.join(process.cwd(), '../../docker-compose.yml');

    beforeAll(() => {
        // Load and parse the docker-compose.yml file
        const fileContents = fs.readFileSync(composeFilePath, 'utf8');
        composeConfig = yaml.load(fileContents);
    });

    describe('File Structure and Version', () => {
        test('should have valid YAML syntax', () => {
            expect(composeConfig).toBeDefined();
            expect(typeof composeConfig).toBe('object');
        });

        test('should specify compose version', () => {
            expect(composeConfig.version).toBeDefined();
            expect(composeConfig.version).toBe('3.8');
        });

        test('should have services defined', () => {
            expect(composeConfig.services).toBeDefined();
            expect(typeof composeConfig.services).toBe('object');
        });
    });

    describe('Services Configuration', () => {
        test('should have exactly two services: backend and frontend', () => {
            const serviceNames = Object.keys(composeConfig.services);
            expect(serviceNames).toHaveLength(2);
            expect(serviceNames).toContain('backend');
            expect(serviceNames).toContain('frontend');
        });

        test('all services should be properly defined', () => {
            Object.keys(composeConfig.services).forEach(serviceName => {
                expect(composeConfig.services[serviceName]).toBeDefined();
                expect(typeof composeConfig.services[serviceName]).toBe('object');
            });
        });
    });

    describe('Backend Service Configuration', () => {
        let backendService: any;

        beforeAll(() => {
            backendService = composeConfig.services.backend;
        });

        test('should have correct image', () => {
            expect(backendService.image).toBe('opsimate/backend:latest');
        });

        test('should have correct container name', () => {
            expect(backendService.container_name).toBe('opsimate-backend');
        });

        test('should expose correct ports', () => {
            expect(backendService.ports).toBeDefined();
            expect(Array.isArray(backendService.ports)).toBe(true);
            expect(backendService.ports).toContain('3001:3001');
        });

        test('should have exactly one port mapping', () => {
            expect(backendService.ports).toHaveLength(1);
        });

        test('should have volume mounts configured', () => {
            expect(backendService.volumes).toBeDefined();
            expect(Array.isArray(backendService.volumes)).toBe(true);
            expect(backendService.volumes.length).toBeGreaterThan(0);
        });

        test('should mount database directory', () => {
            expect(backendService.volumes).toContain('./data/database:/app/data/database');
        });

        test('should mount private-keys directory', () => {
            expect(backendService.volumes).toContain('./data/private-keys:/app/data/private-keys');
        });

        test('should mount config file', () => {
            expect(backendService.volumes).toContain('./config.yml:/app/config/config.yml');
        });

        test('should have exactly three volume mounts', () => {
            expect(backendService.volumes).toHaveLength(3);
        });

        test('should have environment variables defined', () => {
            expect(backendService.environment).toBeDefined();
            expect(Array.isArray(backendService.environment)).toBe(true);
        });

        test('should set NODE_ENV to production', () => {
            expect(backendService.environment).toContain('NODE_ENV=production');
        });

        test('should set HOST to 0.0.0.0', () => {
            expect(backendService.environment).toContain('HOST=0.0.0.0');
        });

        test('should have exactly two environment variables', () => {
            expect(backendService.environment).toHaveLength(2);
        });

        test('should have restart policy set to unless-stopped', () => {
            expect(backendService.restart).toBe('unless-stopped');
        });

        test('should not have healthcheck configured', () => {
            expect(backendService.healthcheck).toBeUndefined();
        });

        test('should not have depends_on configured', () => {
            expect(backendService.depends_on).toBeUndefined();
        });
    });

    describe('Frontend Service Configuration', () => {
        let frontendService: any;

        beforeAll(() => {
            frontendService = composeConfig.services.frontend;
        });

        test('should have correct image', () => {
            expect(frontendService.image).toBe('opsimate/frontend:latest');
        });

        test('should have correct container name', () => {
            expect(frontendService.container_name).toBe('opsimate-frontend');
        });

        test('should expose correct ports', () => {
            expect(frontendService.ports).toBeDefined();
            expect(Array.isArray(frontendService.ports)).toBe(true);
            expect(frontendService.ports).toContain('8080:8080');
        });

        test('should have exactly one port mapping', () => {
            expect(frontendService.ports).toHaveLength(1);
        });

        test('should not have volumes configured', () => {
            expect(frontendService.volumes).toBeUndefined();
        });

        test('should have environment variables defined', () => {
            expect(frontendService.environment).toBeDefined();
            expect(Array.isArray(frontendService.environment)).toBe(true);
        });

        test('should set NODE_ENV to production', () => {
            expect(frontendService.environment).toContain('NODE_ENV=production');
        });

        test('should set API_URL correctly', () => {
            expect(frontendService.environment).toContain('API_URL=http://backend:3001');
        });

        test('should set HOST to 0.0.0.0', () => {
            expect(frontendService.environment).toContain('HOST=0.0.0.0');
        });

        test('should have exactly three environment variables', () => {
            expect(frontendService.environment).toHaveLength(3);
        });

        test('should have restart policy set to unless-stopped', () => {
            expect(frontendService.restart).toBe('unless-stopped');
        });

        test('should not have healthcheck configured', () => {
            expect(frontendService.healthcheck).toBeUndefined();
        });

        test('should not have depends_on configured', () => {
            expect(frontendService.depends_on).toBeUndefined();
        });
    });

    describe('Port Conflicts and Uniqueness', () => {
        test('should not have port conflicts between services', () => {
            const backendPorts = composeConfig.services.backend.ports;
            const frontendPorts = composeConfig.services.frontend.ports;
            
            const allPorts = [...backendPorts, ...frontendPorts];
            const uniquePorts = new Set(allPorts);
            
            expect(allPorts.length).toBe(uniquePorts.size);
        });

        test('backend and frontend should use different ports', () => {
            const backendPort = composeConfig.services.backend.ports[0].split(':')[0];
            const frontendPort = composeConfig.services.frontend.ports[0].split(':')[0];
            
            expect(backendPort).not.toBe(frontendPort);
        });
    });

    describe('Container Names', () => {
        test('should have unique container names', () => {
            const containerNames = Object.values(composeConfig.services)
                .map((service: any) => service.container_name)
                .filter(Boolean);
            
            const uniqueNames = new Set(containerNames);
            expect(containerNames.length).toBe(uniqueNames.size);
        });

        test('all services should have container names defined', () => {
            Object.values(composeConfig.services).forEach((service: any) => {
                expect(service.container_name).toBeDefined();
                expect(typeof service.container_name).toBe('string');
                expect(service.container_name.length).toBeGreaterThan(0);
            });
        });

        test('container names should follow naming convention', () => {
            Object.values(composeConfig.services).forEach((service: any) => {
                expect(service.container_name).toMatch(/^opsimate-/);
            });
        });
    });

    describe('Image Configuration', () => {
        test('all services should use opsimate images', () => {
            Object.values(composeConfig.services).forEach((service: any) => {
                expect(service.image).toBeDefined();
                expect(service.image).toMatch(/^opsimate\//);
            });
        });

        test('all services should use latest tag', () => {
            Object.values(composeConfig.services).forEach((service: any) => {
                expect(service.image).toMatch(/:latest$/);
            });
        });

        test('backend should use backend image', () => {
            expect(composeConfig.services.backend.image).toBe('opsimate/backend:latest');
        });

        test('frontend should use frontend image', () => {
            expect(composeConfig.services.frontend.image).toBe('opsimate/frontend:latest');
        });
    });

    describe('Environment Variables', () => {
        test('all services should have NODE_ENV set', () => {
            Object.values(composeConfig.services).forEach((service: any) => {
                expect(service.environment).toBeDefined();
                expect(service.environment.some((env: string) => env.startsWith('NODE_ENV='))).toBe(true);
            });
        });

        test('all services should set NODE_ENV to production', () => {
            Object.values(composeConfig.services).forEach((service: any) => {
                expect(service.environment).toContain('NODE_ENV=production');
            });
        });

        test('all services should have HOST set to 0.0.0.0', () => {
            Object.values(composeConfig.services).forEach((service: any) => {
                expect(service.environment).toContain('HOST=0.0.0.0');
            });
        });

        test('frontend should have API_URL configured to connect to backend', () => {
            const apiUrlEnv = composeConfig.services.frontend.environment.find(
                (env: string) => env.startsWith('API_URL=')
            );
            expect(apiUrlEnv).toBeDefined();
            expect(apiUrlEnv).toContain('backend:3001');
        });

        test('environment variable format should be valid', () => {
            Object.values(composeConfig.services).forEach((service: any) => {
                service.environment.forEach((env: string) => {
                    expect(env).toMatch(/^[A-Z_]+=.+$/);
                });
            });
        });
    });

    describe('Restart Policies', () => {
        test('all services should have restart policy defined', () => {
            Object.values(composeConfig.services).forEach((service: any) => {
                expect(service.restart).toBeDefined();
                expect(typeof service.restart).toBe('string');
            });
        });

        test('all services should use unless-stopped restart policy', () => {
            Object.values(composeConfig.services).forEach((service: any) => {
                expect(service.restart).toBe('unless-stopped');
            });
        });
    });

    describe('Security and Best Practices', () => {
        test('should not expose database ports directly', () => {
            Object.values(composeConfig.services).forEach((service: any) => {
                if (service.ports) {
                    service.ports.forEach((port: string) => {
                        const externalPort = port.split(':')[0];
                        // Common database ports that should not be exposed
                        const databasePorts = ['3306', '5432', '27017', '6379'];
                        expect(databasePorts).not.toContain(externalPort);
                    });
                }
            });
        });

        test('services should use specific image versions or latest', () => {
            Object.values(composeConfig.services).forEach((service: any) => {
                expect(service.image).toMatch(/:/);
            });
        });

        test('should not have build directives in production compose', () => {
            Object.values(composeConfig.services).forEach((service: any) => {
                expect(service.build).toBeUndefined();
            });
        });
    });

    describe('Volume Configuration', () => {
        test('backend volumes should use relative paths', () => {
            composeConfig.services.backend.volumes.forEach((volume: string) => {
                const [hostPath] = volume.split(':');
                expect(hostPath.startsWith('./')).toBe(true);
            });
        });

        test('backend should mount all critical data directories', () => {
            const volumes = composeConfig.services.backend.volumes;
            const mountedPaths = volumes.map((vol: string) => vol.split(':')[1]);
            
            expect(mountedPaths).toContain('/app/data/database');
            expect(mountedPaths).toContain('/app/data/private-keys');
            expect(mountedPaths).toContain('/app/config/config.yml');
        });

        test('volume paths should be properly formatted', () => {
            if (composeConfig.services.backend.volumes) {
                composeConfig.services.backend.volumes.forEach((volume: string) => {
                    expect(volume).toMatch(/^\.\/.*:\/.*$/);
                });
            }
        });
    });

    describe('Service Interdependencies', () => {
        test('services should not have complex health-based dependencies', () => {
            Object.values(composeConfig.services).forEach((service: any) => {
                if (service.depends_on) {
                    // If depends_on exists, it should be a simple array
                    expect(Array.isArray(service.depends_on) || typeof service.depends_on === 'object').toBe(true);
                    
                    // Should not have complex condition-based dependencies
                    if (typeof service.depends_on === 'object' && !Array.isArray(service.depends_on)) {
                        Object.values(service.depends_on).forEach((dep: any) => {
                            expect(dep.condition).toBeUndefined();
                        });
                    }
                }
            });
        });
    });

    describe('Healthcheck Configuration', () => {
        test('services should not have healthcheck configured', () => {
            Object.values(composeConfig.services).forEach((service: any) => {
                expect(service.healthcheck).toBeUndefined();
            });
        });
    });

    describe('Network Configuration', () => {
        test('should use default network if no networks defined', () => {
            Object.values(composeConfig.services).forEach((service: any) => {
                if (!composeConfig.networks) {
                    expect(service.networks).toBeUndefined();
                }
            });
        });
    });

    describe('API Communication', () => {
        test('frontend API_URL should point to backend service', () => {
            const apiUrlEnv = composeConfig.services.frontend.environment.find(
                (env: string) => env.startsWith('API_URL=')
            );
            const apiUrl = apiUrlEnv.split('=')[1];
            
            expect(apiUrl).toContain('backend');
            expect(apiUrl).toContain('3001');
        });

        test('API_URL should use http protocol', () => {
            const apiUrlEnv = composeConfig.services.frontend.environment.find(
                (env: string) => env.startsWith('API_URL=')
            );
            const apiUrl = apiUrlEnv.split('=')[1];
            
            expect(apiUrl.startsWith('http://')).toBe(true);
        });

        test('API_URL port should match backend port', () => {
            const apiUrlEnv = composeConfig.services.frontend.environment.find(
                (env: string) => env.startsWith('API_URL=')
            );
            const apiUrl = apiUrlEnv.split('=')[1];
            const backendPort = composeConfig.services.backend.ports[0].split(':')[1];
            
            expect(apiUrl).toContain(`:${backendPort}`);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle empty or malformed service definitions gracefully', () => {
            expect(() => {
                Object.keys(composeConfig.services).forEach(serviceName => {
                    const service = composeConfig.services[serviceName];
                    expect(service).toBeTruthy();
                });
            }).not.toThrow();
        });

        test('port mappings should be valid format', () => {
            Object.values(composeConfig.services).forEach((service: any) => {
                if (service.ports) {
                    service.ports.forEach((port: string) => {
                        expect(port).toMatch(/^\d+:\d+$/);
                    });
                }
            });
        });

        test('environment variables should not be empty', () => {
            Object.values(composeConfig.services).forEach((service: any) => {
                if (service.environment) {
                    service.environment.forEach((env: string) => {
                        expect(env.length).toBeGreaterThan(0);
                        expect(env).toContain('=');
                    });
                }
            });
        });
    });

    describe('Production Readiness', () => {
        test('should use production NODE_ENV for all services', () => {
            Object.values(composeConfig.services).forEach((service: any) => {
                const nodeEnv = service.environment.find((env: string) => env.startsWith('NODE_ENV='));
                expect(nodeEnv).toBe('NODE_ENV=production');
            });
        });

        test('should not contain development-only configurations', () => {
            Object.values(composeConfig.services).forEach((service: any) => {
                expect(service.command).toBeUndefined();
                expect(service.working_dir).toBeUndefined();
            });
        });

        test('should use published images, not build contexts', () => {
            Object.values(composeConfig.services).forEach((service: any) => {
                expect(service.image).toBeDefined();
                expect(service.build).toBeUndefined();
            });
        });

        test('restart policies should ensure service availability', () => {
            Object.values(composeConfig.services).forEach((service: any) => {
                expect(['always', 'unless-stopped', 'on-failure']).toContain(service.restart);
            });
        });
    });

    describe('Comparison with Previous Configuration', () => {
        test('should have HOST environment variable added', () => {
            // This is a new requirement - both services should have HOST=0.0.0.0
            expect(composeConfig.services.backend.environment).toContain('HOST=0.0.0.0');
            expect(composeConfig.services.frontend.environment).toContain('HOST=0.0.0.0');
        });

        test('healthcheck should be removed from both services', () => {
            // Healthchecks were removed in the latest version
            expect(composeConfig.services.backend.healthcheck).toBeUndefined();
            expect(composeConfig.services.frontend.healthcheck).toBeUndefined();
        });

        test('complex depends_on conditions should be removed', () => {
            // Complex health-based dependencies were removed
            const frontendDependsOn = composeConfig.services.frontend.depends_on;
            if (frontendDependsOn) {
                // Should not have condition-based dependencies
                if (typeof frontendDependsOn === 'object' && !Array.isArray(frontendDependsOn)) {
                    expect(frontendDependsOn.backend?.condition).toBeUndefined();
                }
            }
        });
    });
});