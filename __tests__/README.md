# Unit Tests for Truck Controller

This directory contains unit tests for the `truckController.js` file.

## Test Coverage

The test file `truckController.test.js` includes comprehensive tests for:

### 1. **createTruck** Function
- ✅ Successfully creates a new truck with auto-generated truckId
- ✅ Handles errors when truck creation fails

### 2. **updateTruckWasteLoad** Function
- ✅ Successfully updates truck waste load and marks garbage as collected
- ✅ Returns error when truck capacity would be exceeded
- ✅ Returns 404 when garbage is not found

## Running the Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (auto-rerun on file changes)
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Structure

Each test follows the **AAA** pattern:
- **Arrange**: Set up test data and mock dependencies
- **Act**: Execute the function being tested
- **Assert**: Verify the expected outcomes

## Mocking

The tests use Jest's mocking capabilities to:
- Mock Mongoose models (`Truck`, `Garbage`, `CollectionRoute`)
- Mock request and response objects
- Simulate database operations without actual database connections

## Dependencies

- **jest**: Testing framework
- **supertest**: HTTP assertion library (installed for future integration tests)

## Notes

- All models are mocked, so tests don't require a database connection
- Tests are isolated and can run independently
- Each test cleans up mocks using `beforeEach` hooks
