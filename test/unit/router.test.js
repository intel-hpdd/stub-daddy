import { describe, beforeEach, it, jasmine, expect, jest } from '../jasmine.js';

describe('router', () => {
  let routerObj, mockIntelRouter, mockMiddleware;
  beforeEach(() => {
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
      processData: 'processData',
      toJson: 'toJson',
      afterTimeout: 'afterTimeout',
      toStream: 'toStream',
      writeResponse: 'writeResponse',
      handleError: 'handleError'
    };

    jest.mock('@mfl/router', () => mockIntelRouter);
    jest.mock('../middleware', () => mockMiddleware);
    require('../../router').default();
  });

  it('should call addStart with processData', () => {
    expect(routerObj.addStart).toHaveBeenCalledOnceWith('processData');
  });

  it('should call addStart with toJson', () => {
    expect(routerObj.addStart).toHaveBeenCalledOnceWith('toJson');
  });

  it('should call addEnd with writeResponse', () => {
    expect(routerObj.addEnd).toHaveBeenCalledOnceWith('writeResponse');
  });
});
