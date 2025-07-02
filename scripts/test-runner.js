#!/usr/bin/env node

/**
 * Comprehensive Test Runner for SocialZ App
 * Orchestrates all testing types with detailed reporting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      unit: null,
      integration: null,
      performance: null,
      security: null,
      accessibility: null,
      e2e: null,
      coverage: null,
      startTime: Date.now(),
      endTime: null,
    };
    
    this.isCI = process.env.CI === 'true';
    this.verbose = process.argv.includes('--verbose');
    this.skipE2E = process.argv.includes('--skip-e2e');
    this.parallel = process.argv.includes('--parallel');
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const levels = {
      info: '\x1b[36m[INFO]\x1b[0m',
      success: '\x1b[32m[SUCCESS]\x1b[0m',
      error: '\x1b[31m[ERROR]\x1b[0m',
      warning: '\x1b[33m[WARNING]\x1b[0m',
    };
    
    console.log(`${levels[level]} ${timestamp} ${message}`);
  }

  async runCommand(command, name, options = {}) {
    this.log(`Starting ${name}...`);
    const startTime = Date.now();
    
    try {
      const result = execSync(command, {
        stdio: this.verbose ? 'inherit' : 'pipe',
        encoding: 'utf8',
        ...options,
      });
      
      const duration = Date.now() - startTime;
      this.log(`${name} completed successfully in ${duration}ms`, 'success');
      
      return {
        success: true,
        duration,
        output: result,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log(`${name} failed after ${duration}ms: ${error.message}`, 'error');
      
      return {
        success: false,
        duration,
        error: error.message,
        output: error.stdout || error.stderr,
      };
    }
  }

  async runUnitTests() {
    this.log('🧪 Running Unit Tests');
    
    const result = await this.runCommand(
      'npm run test:unit -- --coverage --passWithNoTests',
      'Unit Tests'
    );
    
    this.results.unit = result;
    return result;
  }

  async runIntegrationTests() {
    this.log('🔗 Running Integration Tests');
    
    const result = await this.runCommand(
      'npm run test:integration -- --passWithNoTests',
      'Integration Tests'
    );
    
    this.results.integration = result;
    return result;
  }

  async runPerformanceTests() {
    this.log('⚡ Running Performance Tests');
    
    const result = await this.runCommand(
      'npm run test:performance -- --passWithNoTests',
      'Performance Tests'
    );
    
    this.results.performance = result;
    return result;
  }

  async runSecurityTests() {
    this.log('🔒 Running Security Tests');
    
    const result = await this.runCommand(
      'npm run test:security -- --passWithNoTests',
      'Security Tests'
    );
    
    // Also run security audit
    const auditResult = await this.runCommand(
      'npm audit --audit-level=moderate',
      'Security Audit'
    );
    
    this.results.security = {
      tests: result,
      audit: auditResult,
      success: result.success && auditResult.success,
    };
    
    return this.results.security;
  }

  async runAccessibilityTests() {
    this.log('♿ Running Accessibility Tests');
    
    const result = await this.runCommand(
      'npm run test:accessibility -- --passWithNoTests',
      'Accessibility Tests'
    );
    
    this.results.accessibility = result;
    return result;
  }

  async runE2ETests() {
    if (this.skipE2E) {
      this.log('Skipping E2E tests as requested', 'warning');
      return { success: true, skipped: true };
    }

    this.log('🚀 Running E2E Tests');
    
    // Build app first
    const buildResult = await this.runCommand(
      'npm run test:e2e:build',
      'E2E App Build'
    );
    
    if (!buildResult.success) {
      this.results.e2e = buildResult;
      return buildResult;
    }

    // Run E2E tests
    const testResult = await this.runCommand(
      'npm run test:e2e',
      'E2E Tests'
    );
    
    this.results.e2e = {
      build: buildResult,
      tests: testResult,
      success: buildResult.success && testResult.success,
    };
    
    return this.results.e2e;
  }

  async generateCoverageReport() {
    this.log('📊 Generating Coverage Report');
    
    const result = await this.runCommand(
      'npm run test:coverage -- --silent',
      'Coverage Report'
    );
    
    if (result.success) {
      // Parse coverage data
      try {
        const coveragePath = path.join(process.cwd(), 'coverage/coverage-summary.json');
        if (fs.existsSync(coveragePath)) {
          const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
          this.results.coverage = {
            ...result,
            data: coverageData.total,
          };
        }
      } catch (error) {
        this.log(`Failed to parse coverage data: ${error.message}`, 'warning');
      }
    }
    
    this.results.coverage = result;
    return result;
  }

  async runLinting() {
    this.log('🔍 Running Linting');
    
    const result = await this.runCommand(
      'npm run lint',
      'ESLint'
    );
    
    return result;
  }

  async runTypeChecking() {
    this.log('📝 Running Type Checking');
    
    const result = await this.runCommand(
      'npm run type-check',
      'TypeScript Check'
    );
    
    return result;
  }

  async runTestsInParallel() {
    this.log('🔄 Running tests in parallel mode');
    
    const testPromises = [
      this.runUnitTests(),
      this.runIntegrationTests(),
      this.runPerformanceTests(),
      this.runSecurityTests(),
      this.runAccessibilityTests(),
    ];
    
    const results = await Promise.allSettled(testPromises);
    
    // Map results back to individual test types
    const [unit, integration, performance, security, accessibility] = results.map(
      result => result.status === 'fulfilled' ? result.value : { success: false, error: result.reason }
    );
    
    this.results.unit = unit;
    this.results.integration = integration;
    this.results.performance = performance;
    this.results.security = security;
    this.results.accessibility = accessibility;
    
    return results;
  }

  async runTestsSequentially() {
    this.log('🔄 Running tests sequentially');
    
    const results = [];
    
    // Pre-test checks
    results.push(await this.runLinting());
    results.push(await this.runTypeChecking());
    
    // Core tests
    results.push(await this.runUnitTests());
    results.push(await this.runIntegrationTests());
    results.push(await this.runPerformanceTests());
    results.push(await this.runSecurityTests());
    results.push(await this.runAccessibilityTests());
    
    // E2E tests (if enabled)
    if (!this.skipE2E) {
      results.push(await this.runE2ETests());
    }
    
    // Coverage report
    results.push(await this.generateCoverageReport());
    
    return results;
  }

  generateSummaryReport() {
    this.results.endTime = Date.now();
    const totalDuration = this.results.endTime - this.results.startTime;
    
    this.log('\n📋 TEST SUMMARY REPORT');
    this.log('═'.repeat(50));
    
    const testTypes = [
      'unit',
      'integration', 
      'performance',
      'security',
      'accessibility',
      'e2e',
      'coverage',
    ];
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    testTypes.forEach(type => {
      const result = this.results[type];
      if (!result) return;
      
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const duration = result.duration ? `(${result.duration}ms)` : '';
      
      this.log(`${type.toUpperCase().padEnd(15)} ${status} ${duration}`);
      
      if (result.success) {
        totalPassed++;
      } else {
        totalFailed++;
        if (result.error) {
          this.log(`  Error: ${result.error}`, 'error');
        }
      }
    });
    
    this.log('═'.repeat(50));
    this.log(`Total Duration: ${totalDuration}ms`);
    this.log(`Passed: ${totalPassed} | Failed: ${totalFailed}`);
    
    // Coverage summary
    if (this.results.coverage?.data) {
      const { lines, functions, branches, statements } = this.results.coverage.data;
      this.log('\nCOVERAGE SUMMARY:');
      this.log(`Lines: ${lines.pct}% | Functions: ${functions.pct}% | Branches: ${branches.pct}% | Statements: ${statements.pct}%`);
    }
    
    // Overall status
    const overallSuccess = totalFailed === 0;
    this.log(`\nOVERALL STATUS: ${overallSuccess ? '✅ SUCCESS' : '❌ FAILURE'}`, overallSuccess ? 'success' : 'error');
    
    return overallSuccess;
  }

  async generateJUnitReport() {
    if (!this.isCI) return;
    
    this.log('📄 Generating JUnit report for CI');
    
    const junit = {
      testsuites: {
        $: {
          name: 'SocialZ Test Suite',
          tests: 0,
          failures: 0,
          time: (this.results.endTime - this.results.startTime) / 1000,
        },
        testsuite: [],
      },
    };
    
    Object.entries(this.results).forEach(([type, result]) => {
      if (!result || type === 'startTime' || type === 'endTime') return;
      
      junit.testsuites.testsuite.push({
        $: {
          name: type,
          tests: 1,
          failures: result.success ? 0 : 1,
          time: (result.duration || 0) / 1000,
        },
        testcase: {
          $: {
            name: `${type} tests`,
            classname: `SocialZ.${type}`,
            time: (result.duration || 0) / 1000,
          },
          ...(result.success ? {} : {
            failure: {
              $: { message: result.error || 'Test failed' },
              _: result.output || 'No output available',
            },
          }),
        },
      });
      
      junit.testsuites.$.tests++;
      if (!result.success) {
        junit.testsuites.$.failures++;
      }
    });
    
    // Write JUnit XML
    const xml = this.convertToXML(junit);
    fs.writeFileSync('test-results.xml', xml);
    this.log('JUnit report saved to test-results.xml');
  }

  convertToXML(obj) {
    // Simple XML conversion - in production, use a proper XML library
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    
    function objectToXML(obj, indent = '') {
      let result = '';
      
      Object.entries(obj).forEach(([key, value]) => {
        if (key === '$') return; // Attributes handled separately
        
        if (Array.isArray(value)) {
          value.forEach(item => {
            result += `${indent}<${key}`;
            if (item.$) {
              Object.entries(item.$).forEach(([attr, attrValue]) => {
                result += ` ${attr}="${attrValue}"`;
              });
            }
            result += '>\n';
            result += objectToXML(item, indent + '  ');
            result += `${indent}</${key}>\n`;
          });
        } else if (typeof value === 'object' && value !== null) {
          result += `${indent}<${key}`;
          if (value.$) {
            Object.entries(value.$).forEach(([attr, attrValue]) => {
              result += ` ${attr}="${attrValue}"`;
            });
          }
          result += '>\n';
          result += objectToXML(value, indent + '  ');
          result += `${indent}</${key}>\n`;
        } else if (key === '_') {
          result += `${indent}${value}\n`;
        } else if (key !== '$') {
          result += `${indent}<${key}>${value}</${key}>\n`;
        }
      });
      
      return result;
    }
    
    return xml + objectToXML(obj);
  }

  async run() {
    this.log('🚀 Starting SocialZ Test Suite');
    this.log(`Environment: ${this.isCI ? 'CI' : 'Local'}`);
    this.log(`Mode: ${this.parallel ? 'Parallel' : 'Sequential'}`);
    
    try {
      if (this.parallel) {
        await this.runTestsInParallel();
        
        // E2E tests still run sequentially
        if (!this.skipE2E) {
          await this.runE2ETests();
        }
        
        // Coverage report
        await this.generateCoverageReport();
      } else {
        await this.runTestsSequentially();
      }
      
      const success = this.generateSummaryReport();
      
      if (this.isCI) {
        await this.generateJUnitReport();
      }
      
      process.exit(success ? 0 : 1);
      
    } catch (error) {
      this.log(`Test runner failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Check if running directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.run();
}

module.exports = TestRunner; 