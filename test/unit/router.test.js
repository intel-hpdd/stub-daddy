import { describe, beforeEach, it, jasmine, expect, jest } from '../jasmine.js';

describe('router', function() {
  let routerObj, mockIntelRouter, mockMiddleware;
  beforeEach(function() {
    routerObj = {
      addStart: jasmine.createSpy('routerObj.addStart'),
      addEnd: jasmine.createSpy('routerObj.addEnd')
    };
    routerObj.addStart.and.returnValue(routerObj);
    routerObj.addEnd.and.returnValue(routerObj);

    mockIntelRouter = jasmine
      .createSpy('intelRouter')
      .and.returnValue(routerObj);
    mockMiddleware = {
      processData: { default: 'processData' },
      toJson: { default: 'toJson' },
      afterTimeout: { default: 'afterTimeout' },
      toStream: { default: 'toStream' },
      writeResponse: { default: 'writeResponse' },
      handleError: { default: 'handleError' }
    };

    jest.mock('@mfl/router', () => mockIntelRouter);
    jest.mock('../middleware', () => mockMiddleware);
    require('../../router').default();
  });

  it('should call addStart with processData', function() {
    expect(routerObj.addStart).toHaveBeenCalledOnceWith('processData');
  });

  it('should call addStart with toJson', function() {
    expect(routerObj.addStart).toHaveBeenCalledOnceWith('toJson');
  });

  it('should call addEnd with writeResponse', function() {
    expect(routerObj.addEnd).toHaveBeenCalledOnceWith('writeResponse');
  });
});
