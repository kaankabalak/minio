/*
 * Minio Cloud Storage (C) 2018 Minio, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import configureStore from "redux-mock-store"
import thunk from "redux-thunk"
import * as actionsObjects from "../actions"
import * as alertActions from "../../alert/actions"

jest.mock("../../web", () => ({
  ListObjects: jest.fn(() => {
    return Promise.resolve({
      objects: [{ name: "test1" }, { name: "test2" }],
      istruncated: false,
      nextmarker: "test2"
    })
  }),
  RemoveObject: jest.fn(({ bucketName, objects }) => {
    if (!bucketName) {
      return Promise.reject({ message: "Invalid bucket" })
    }
    return Promise.resolve({})
  }),
  PresignedGet: jest.fn(({ bucket, object }) => {
    if (!bucket) {
      return Promise.reject({ message: "Invalid bucket" })
    }
    return Promise.resolve({ url: "https://test.com/bk1/pre1/b.txt" })
  })
}))

const middlewares = [thunk]
const mockStore = configureStore(middlewares)

describe("Objects actions", () => {
  it("creates objects/SET_LIST action", () => {
    const store = mockStore()
    const expectedActions = [
      {
        type: "objects/SET_LIST",
        objects: [{ name: "test1" }, { name: "test2" }],
        isTruncated: false,
        marker: "test2"
      }
    ]
    store.dispatch(
      actionsObjects.setList(
        [{ name: "test1" }, { name: "test2" }],
        "test2",
        false
      )
    )
    const actions = store.getActions()
    expect(actions).toEqual(expectedActions)
  })

  it("creates objects/SET_SORT_BY action", () => {
    const store = mockStore()
    const expectedActions = [
      {
        type: "objects/SET_SORT_BY",
        sortBy: "name"
      }
    ]
    store.dispatch(actionsObjects.setSortBy("name"))
    const actions = store.getActions()
    expect(actions).toEqual(expectedActions)
  })

  it("creates objects/SET_SORT_ORDER action", () => {
    const store = mockStore()
    const expectedActions = [
      {
        type: "objects/SET_SORT_ORDER",
        sortOrder: true
      }
    ]
    store.dispatch(actionsObjects.setSortOrder(true))
    const actions = store.getActions()
    expect(actions).toEqual(expectedActions)
  })

  it("creates objects/SET_LIST after fetching the objects", () => {
    const store = mockStore({
      buckets: { currentBucket: "bk1" },
      objects: { currentPrefix: "" }
    })
    const expectedActions = [
      {
        type: "objects/SET_LIST",
        objects: [{ name: "test1" }, { name: "test2" }],
        marker: "test2",
        isTruncated: false
      },
      {
        type: "objects/SET_SORT_BY",
        sortBy: ""
      },
      {
        type: "objects/SET_SORT_ORDER",
        sortOrder: false
      }
    ]
    return store.dispatch(actionsObjects.fetchObjects()).then(() => {
      const actions = store.getActions()
      expect(actions).toEqual(expectedActions)
    })
  })

  it("creates objects/APPEND_LIST after fetching more objects", () => {
    const store = mockStore({
      buckets: { currentBucket: "bk1" },
      objects: { currentPrefix: "" }
    })
    const expectedActions = [
      {
        type: "objects/APPEND_LIST",
        objects: [{ name: "test1" }, { name: "test2" }],
        marker: "test2",
        isTruncated: false
      }
    ]
    return store.dispatch(actionsObjects.fetchObjects(true)).then(() => {
      const actions = store.getActions()
      expect(actions).toEqual(expectedActions)
    })
  })

  it("creates objects/SET_SORT_BY and objects/SET_SORT_ORDER when sortObjects is called", () => {
    const store = mockStore({
      objects: {
        list: [],
        sortBy: "",
        sortOrder: false,
        isTruncated: false,
        marker: ""
      }
    })
    const expectedActions = [
      {
        type: "objects/SET_SORT_BY",
        sortBy: "name"
      },
      {
        type: "objects/SET_SORT_ORDER",
        sortOrder: true
      },
      {
        type: "objects/SET_LIST",
        objects: [],
        isTruncated: false,
        marker: ""
      }
    ]
    store.dispatch(actionsObjects.sortObjects("name"))
    const actions = store.getActions()
    expect(actions).toEqual(expectedActions)
  })

  it("should update browser url and creates objects/SET_CURRENT_PREFIX action when selectPrefix is called", () => {
    const store = mockStore({
      buckets: { currentBucket: "test" },
      objects: { currentPrefix: "" }
    })
    const expectedActions = [
      { type: "objects/SET_CURRENT_PREFIX", prefix: "abc/" }
    ]
    store.dispatch(actionsObjects.selectPrefix("abc/"))
    const actions = store.getActions()
    expect(actions).toEqual(expectedActions)
    expect(window.location.pathname.endsWith("/test/abc/")).toBeTruthy()
  })

  it("creates objects/REMOVE action", () => {
    const store = mockStore()
    const expectedActions = [{ type: "objects/REMOVE", object: "obj1" }]
    store.dispatch(actionsObjects.removeObject("obj1"))
    const actions = store.getActions()
    expect(actions).toEqual(expectedActions)
  })

  it("creates objects/REMOVE action when object is deleted", () => {
    const store = mockStore({
      buckets: { currentBucket: "test" },
      objects: { currentPrefix: "pre1/" }
    })
    const expectedActions = [{ type: "objects/REMOVE", object: "obj1" }]
    store.dispatch(actionsObjects.deleteObject("obj1")).then(() => {
      const actions = store.getActions()
      expect(actions).toEqual(expectedActions)
    })
  })

  it("creates alert/SET action when invalid bucket is provided", () => {
    const store = mockStore({
      buckets: { currentBucket: "" },
      objects: { currentPrefix: "pre1/" }
    })
    const expectedActions = [
      {
        type: "alert/SET",
        alert: { type: "danger", message: "Invalid bucket", id: 0 }
      }
    ]
    return store.dispatch(actionsObjects.deleteObject("obj1")).then(() => {
      const actions = store.getActions()
      expect(actions).toEqual(expectedActions)
    })
  })

  it("creates objects/SET_SHARE_OBJECT action for showShareObject", () => {
    const store = mockStore()
    const expectedActions = [
      {
        type: "objects/SET_SHARE_OBJECT",
        show: true,
        object: "b.txt",
        url: "test"
      }
    ]
    store.dispatch(actionsObjects.showShareObject("b.txt", "test"))
    const actions = store.getActions()
    expect(actions).toEqual(expectedActions)
  })

  it("creates objects/SET_SHARE_OBJECT action for hideShareObject", () => {
    const store = mockStore()
    const expectedActions = [
      {
        type: "objects/SET_SHARE_OBJECT",
        show: false,
        object: "",
        url: ""
      }
    ]
    store.dispatch(actionsObjects.hideShareObject())
    const actions = store.getActions()
    expect(actions).toEqual(expectedActions)
  })

  it("creates objects/SET_SHARE_OBJECT when object is shared", () => {
    const store = mockStore({
      buckets: { currentBucket: "bk1" },
      objects: { currentPrefix: "pre1/" }
    })
    const expectedActions = [
      {
        type: "objects/SET_SHARE_OBJECT",
        show: true,
        object: "a.txt",
        url: "https://test.com/bk1/pre1/b.txt"
      },
      {
        type: "alert/SET",
        alert: {
          type: "success",
          message: "Object shared. Expires in 1 days 0 hours 0 minutes",
          id: alertActions.alertId
        }
      }
    ]
    return store
      .dispatch(actionsObjects.shareObject("a.txt", 1, 0, 0))
      .then(() => {
        const actions = store.getActions()
        expect(actions).toEqual(expectedActions)
      })
  })

  it("creates alert/SET when shareObject is failed", () => {
    const store = mockStore({
      buckets: { currentBucket: "" },
      objects: { currentPrefix: "pre1/" }
    })
    const expectedActions = [
      {
        type: "alert/SET",
        alert: {
          type: "danger",
          message: "Invalid bucket",
          id: alertActions.alertId
        }
      }
    ]
    return store
      .dispatch(actionsObjects.shareObject("a.txt", 1, 0, 0))
      .then(() => {
        const actions = store.getActions()
        expect(actions).toEqual(expectedActions)
      })
  })
})
