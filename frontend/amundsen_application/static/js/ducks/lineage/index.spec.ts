import { testSaga } from 'redux-saga-test-plan';

import { Lineage } from 'interfaces';

import * as API from './api/v0';

import {
  getTableLineage,
  getTableLineageFailure,
  getTableLineageSuccess,
  getColumnLineage,
  getColumnLineageFailure,
  getColumnLineageSuccess,
  getTableColumnLineageSuccess,
  getTableColumnLineageFailure,
  initialLineageState,
} from './reducer';

import {
  getTableLineageWatcher,
  getTableLineageWorker,
  getColumnLineageWatcher,
  getColumnLineageWorker,
} from './sagas';

import { GetTableLineage, GetColumnLineage } from './types';

describe('tableMetadata ducks', () => {
  let testLineage: Lineage;

  let columnName: string;
  let testKey: string;

  beforeAll(() => {
    testKey = 'tableKey';
    testLineage = {
      upstream_entities: [
        {
          badges: [],
          cluster: 'cluster',
          database: 'database',
          key: 'key',
          level: 1,
          name: 'name',
          schema: 'schema',
          usage: 100,
          parent: 'parent',
        },
      ],
      downstream_entities: [],
    };

    columnName = 'column_name';
  });

  describe('actions', () => {
    it('getTableLineage - returns the action to get table lineage', () => {
      const action = getTableLineage(testKey);
      const { payload } = action;
      expect(action.type).toBe(GetTableLineage.REQUEST);
      expect(payload.key).toBe(testKey);
    });

    it('getTableLineage - returns the action to process failure', () => {
      const status = 500;
      const action = getTableLineageFailure(status);
      const { payload } = action;
      expect(action.type).toBe(GetTableLineage.FAILURE);
      expect(payload.lineage).toBe(initialLineageState.lineageTree);
      expect(payload.status).toBe(status);
    });

    it('getTableLineage - returns the action to process success', () => {
      const status = 200;
      const action = getTableLineageSuccess(testLineage, status);
      const { payload } = action;
      expect(action.type).toBe(GetTableLineage.SUCCESS);
      expect(payload.lineage).toBe(testLineage);
      expect(payload.status).toBe(status);
    });

    it('getColumnLineage - returns the action to get column lineage', () => {
      const action = getColumnLineage(testKey, columnName);
      const { payload, meta } = action;
      expect(action.type).toBe(GetColumnLineage.REQUEST);
      expect(payload.key).toBe(testKey);
      expect(payload.columnName).toBe(columnName);
      expect(meta.analytics).not.toBeNull();
    });

    it('getColumnLineage - returns the action to process failure', () => {
      const status = 500;
      const action = getColumnLineageFailure(status);
      const { payload } = action;
      expect(action.type).toBe(GetColumnLineage.FAILURE);
      expect(payload.lineage).toBe(initialLineageState.lineageTree);
      expect(payload.status).toBe(status);
    });

    it('getTableColumnLineage - returns the action to process success', () => {
      const status = 200;
      const action = getColumnLineageSuccess(testLineage, status);
      const { payload } = action;
      expect(action.type).toBe(GetColumnLineage.SUCCESS);
      expect(payload.lineage).toBe(testLineage);
      expect(payload.status).toBe(status);
    });

    it('getColumnLineage - returns the action to process success', () => {
      const status = 200;
      const action = getTableColumnLineageSuccess(
        testLineage,
        columnName,
        status
      );
      const { payload } = action;
      expect(action.type).toBe(GetColumnLineage.SUCCESS);
      expect(payload.columnName).toBe(columnName);
      expect(payload.lineage).toBe(testLineage);
      expect(payload.status).toBe(status);
    });

    it('getTableColumnLineage - returns the action to process failure', () => {
      const status = 500;
      const action = getTableColumnLineageFailure(columnName, status);
      const { payload } = action;
      expect(action.type).toBe(GetColumnLineage.FAILURE);
      expect(payload.columnName).toBe(columnName);
      expect(payload.lineage).toBe(initialLineageState.lineageTree);
      expect(payload.status).toBe(status);
    });
  });

  describe('sagas', () => {
    describe('getTableLineageWatcher', () => {
      it('takes every GetTableLineage.REQUEST with getTableLineageWorker', () => {
        testSaga(getTableLineageWatcher)
          .next()
          .takeEvery(GetTableLineage.REQUEST, getTableLineageWorker)
          .next()
          .isDone();
      });
    });

    describe('getTableLineageWorker', () => {
      it('executes flow for getting table lineage', () => {
        testSaga(getTableLineageWorker, getTableLineage(testKey))
          .next()
          .call(API.getTableLineage, testKey)
          .next({ data: testLineage, status: 200 })
          .put(getTableLineageSuccess(testLineage, 200))
          .next()
          .isDone();
      });

      it('handles request error', () => {
        testSaga(getTableLineageWorker, getTableLineage(testKey))
          .next()
          .call(API.getTableLineage, testKey)
          // @ts-ignore
          .throw({ status: 500 })
          .put(getTableLineageFailure(500))
          .next()
          .isDone();
      });
    });

    describe('getColumnLineageWatcher', () => {
      it('takes every GetColumnLineage.REQUEST with getColumnLineageWorker', () => {
        testSaga(getColumnLineageWatcher)
          .next()
          .takeEvery(GetColumnLineage.REQUEST, getColumnLineageWorker)
          .next()
          .isDone();
      });
    });

    describe('getColumnLineageWorker', () => {
      it('executes flow for getting column lineage', () => {
        testSaga(getColumnLineageWorker, getColumnLineage(testKey, columnName))
          .next()
          .call(API.getColumnLineage, testKey, columnName)
          .next({ data: testLineage, status: 200 })
          .put(getColumnLineageSuccess(testLineage, 200))
          .next()
          .isDone();
      });

      it('handles request error', () => {
        testSaga(getColumnLineageWorker, getColumnLineage(testKey, columnName))
          .next()
          .call(API.getColumnLineage, testKey, columnName)
          // @ts-ignore
          .throw({ status: 500 })
          .put(getColumnLineageFailure(500))
          .next()
          .isDone();
      });
    });
  });
});