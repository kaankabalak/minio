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

import React from "react"
import { shallow, mount } from "enzyme"
import { PolicyInput } from "../PolicyInput"
import { READ_ONLY, WRITE_ONLY, READ_WRITE } from "../../constants"
import web from "../../web"

jest.mock("../../web", () => ({
  ListAllBucketPolicies: jest.fn(() => {
    return Promise.resolve({ policies: [] })
  }),
  SetBucketPolicy: jest.fn(() => {
    return Promise.resolve( )
  })
}))

describe("PolicyInput", () => {
  it("should render without crashing", () => {
    shallow(<PolicyInput currentBucket={"bucket1"} />)
  })

  it("should retrieve all policies for the bucket and call setPolicies", () => {
    const setPolicies = jest.fn()
    const wrapper = shallow(
      <PolicyInput currentBucket={"bucket"} setPolicies={setPolicies} />
    )
    setImmediate(() => {
      expect(setPolicies).toHaveBeenCalled()
    })
  })

  it("should call web.setBucketPolicy on submit and call setPolicies after the " +
     "response is received", () => {
    const setPolicies = jest.fn()
    const wrapper = shallow(
      <PolicyInput currentBucket={"bucket"} policies={[]} setPolicies={setPolicies}/>
    )
    wrapper.instance().prefix = { value: "baz" }
    wrapper.instance().policy = { value: READ_ONLY }
    wrapper.find("button").simulate("click", { preventDefault: jest.fn() })

    expect(web.SetBucketPolicy).toHaveBeenCalledWith({
      bucketName: "bucket",
      prefix: "baz",
      policy: READ_ONLY
    })

    expect(web.ListAllBucketPolicies).toHaveBeenCalledWith({ bucketName: "bucket" })

    setImmediate(() => {
      expect(setPolicies).toHaveBeenCalled()
    })
  })

  it("should change the prefix '*' to an empty string", () => {
    const wrapper = shallow(
      <PolicyInput currentBucket={"bucket"} policies={[]}/>
    )
    wrapper.instance().prefix = { value: "*" }
    wrapper.instance().policy = { value: READ_ONLY }

    wrapper.find("button").simulate("click", { preventDefault: jest.fn() })

    expect(wrapper.instance().prefix).toEqual({ value: "" })
  })
})
