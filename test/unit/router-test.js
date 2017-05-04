const proxyquire = require('proxyquire').noPreserveCache().noCallThru();

describe('router', function() {
  let router, routerObj, intelRouter, middleware;
  beforeEach(function() {
    routerObj = {
      addStart: jasmine.createSpy('routerObj.addStart'),
      addEnd: jasmine.createSpy('routerObj.addEnd')
    };
    routerObj.addStart.and.returnValue(routerObj);
    routerObj.addEnd.and.returnValue(routerObj);

    intelRouter = jasmine.createSpy('intelRouter').and.returnValue(routerObj);
    middleware = {
      processData: 'processData',
      toJson: 'toJson',
      afterTimeout: 'afterTimeout',
      toStream: 'toStream',
      writeResponse: 'writeResponse',
      handleError: 'handleError'
    };

    router = proxyquire('../../router', {
      '@mfl/router': intelRouter,
      './middleware': middleware
    });
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
