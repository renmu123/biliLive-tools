/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader,
  $Writer = $protobuf.Writer,
  $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const douyin = ($root.douyin = (() => {
  /**
   * Namespace douyin.
   * @exports douyin
   * @namespace
   */
  const douyin = {};

  douyin.Response = (function () {
    /**
     * Properties of a Response.
     * @memberof douyin
     * @interface IResponse
     * @property {Array.<douyin.IMessage>|null} [messagesList] Response messagesList
     * @property {string|null} [cursor] Response cursor
     * @property {number|Long|null} [fetchInterval] Response fetchInterval
     * @property {number|Long|null} [now] Response now
     * @property {string|null} [internalExt] Response internalExt
     * @property {number|null} [fetchType] Response fetchType
     * @property {Object.<string,string>|null} [routeParams] Response routeParams
     * @property {number|Long|null} [heartbeatDuration] Response heartbeatDuration
     * @property {boolean|null} [needAck] Response needAck
     * @property {string|null} [pushServer] Response pushServer
     * @property {string|null} [liveCursor] Response liveCursor
     * @property {boolean|null} [historyNoMore] Response historyNoMore
     */

    /**
     * Constructs a new Response.
     * @memberof douyin
     * @classdesc Represents a Response.
     * @implements IResponse
     * @constructor
     * @param {douyin.IResponse=} [properties] Properties to set
     */
    function Response(properties) {
      this.messagesList = [];
      this.routeParams = {};
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * Response messagesList.
     * @member {Array.<douyin.IMessage>} messagesList
     * @memberof douyin.Response
     * @instance
     */
    Response.prototype.messagesList = $util.emptyArray;

    /**
     * Response cursor.
     * @member {string} cursor
     * @memberof douyin.Response
     * @instance
     */
    Response.prototype.cursor = "";

    /**
     * Response fetchInterval.
     * @member {number|Long} fetchInterval
     * @memberof douyin.Response
     * @instance
     */
    Response.prototype.fetchInterval = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Response now.
     * @member {number|Long} now
     * @memberof douyin.Response
     * @instance
     */
    Response.prototype.now = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Response internalExt.
     * @member {string} internalExt
     * @memberof douyin.Response
     * @instance
     */
    Response.prototype.internalExt = "";

    /**
     * Response fetchType.
     * @member {number} fetchType
     * @memberof douyin.Response
     * @instance
     */
    Response.prototype.fetchType = 0;

    /**
     * Response routeParams.
     * @member {Object.<string,string>} routeParams
     * @memberof douyin.Response
     * @instance
     */
    Response.prototype.routeParams = $util.emptyObject;

    /**
     * Response heartbeatDuration.
     * @member {number|Long} heartbeatDuration
     * @memberof douyin.Response
     * @instance
     */
    Response.prototype.heartbeatDuration = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Response needAck.
     * @member {boolean} needAck
     * @memberof douyin.Response
     * @instance
     */
    Response.prototype.needAck = false;

    /**
     * Response pushServer.
     * @member {string} pushServer
     * @memberof douyin.Response
     * @instance
     */
    Response.prototype.pushServer = "";

    /**
     * Response liveCursor.
     * @member {string} liveCursor
     * @memberof douyin.Response
     * @instance
     */
    Response.prototype.liveCursor = "";

    /**
     * Response historyNoMore.
     * @member {boolean} historyNoMore
     * @memberof douyin.Response
     * @instance
     */
    Response.prototype.historyNoMore = false;

    /**
     * Creates a new Response instance using the specified properties.
     * @function create
     * @memberof douyin.Response
     * @static
     * @param {douyin.IResponse=} [properties] Properties to set
     * @returns {douyin.Response} Response instance
     */
    Response.create = function create(properties) {
      return new Response(properties);
    };

    /**
     * Encodes the specified Response message. Does not implicitly {@link douyin.Response.verify|verify} messages.
     * @function encode
     * @memberof douyin.Response
     * @static
     * @param {douyin.IResponse} message Response message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Response.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.messagesList != null && message.messagesList.length)
        for (let i = 0; i < message.messagesList.length; ++i)
          $root.douyin.Message.encode(
            message.messagesList[i],
            writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
          ).ldelim();
      if (message.cursor != null && Object.hasOwnProperty.call(message, "cursor"))
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.cursor);
      if (message.fetchInterval != null && Object.hasOwnProperty.call(message, "fetchInterval"))
        writer.uint32(/* id 3, wireType 0 =*/ 24).uint64(message.fetchInterval);
      if (message.now != null && Object.hasOwnProperty.call(message, "now"))
        writer.uint32(/* id 4, wireType 0 =*/ 32).uint64(message.now);
      if (message.internalExt != null && Object.hasOwnProperty.call(message, "internalExt"))
        writer.uint32(/* id 5, wireType 2 =*/ 42).string(message.internalExt);
      if (message.fetchType != null && Object.hasOwnProperty.call(message, "fetchType"))
        writer.uint32(/* id 6, wireType 0 =*/ 48).uint32(message.fetchType);
      if (message.routeParams != null && Object.hasOwnProperty.call(message, "routeParams"))
        for (let keys = Object.keys(message.routeParams), i = 0; i < keys.length; ++i)
          writer
            .uint32(/* id 7, wireType 2 =*/ 58)
            .fork()
            .uint32(/* id 1, wireType 2 =*/ 10)
            .string(keys[i])
            .uint32(/* id 2, wireType 2 =*/ 18)
            .string(message.routeParams[keys[i]])
            .ldelim();
      if (
        message.heartbeatDuration != null &&
        Object.hasOwnProperty.call(message, "heartbeatDuration")
      )
        writer.uint32(/* id 8, wireType 0 =*/ 64).uint64(message.heartbeatDuration);
      if (message.needAck != null && Object.hasOwnProperty.call(message, "needAck"))
        writer.uint32(/* id 9, wireType 0 =*/ 72).bool(message.needAck);
      if (message.pushServer != null && Object.hasOwnProperty.call(message, "pushServer"))
        writer.uint32(/* id 10, wireType 2 =*/ 82).string(message.pushServer);
      if (message.liveCursor != null && Object.hasOwnProperty.call(message, "liveCursor"))
        writer.uint32(/* id 11, wireType 2 =*/ 90).string(message.liveCursor);
      if (message.historyNoMore != null && Object.hasOwnProperty.call(message, "historyNoMore"))
        writer.uint32(/* id 12, wireType 0 =*/ 96).bool(message.historyNoMore);
      return writer;
    };

    /**
     * Encodes the specified Response message, length delimited. Does not implicitly {@link douyin.Response.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.Response
     * @static
     * @param {douyin.IResponse} message Response message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Response.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a Response message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.Response
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.Response} Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Response.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.Response(),
        key,
        value;
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            if (!(message.messagesList && message.messagesList.length)) message.messagesList = [];
            message.messagesList.push($root.douyin.Message.decode(reader, reader.uint32()));
            break;
          }
          case 2: {
            message.cursor = reader.string();
            break;
          }
          case 3: {
            message.fetchInterval = reader.uint64();
            break;
          }
          case 4: {
            message.now = reader.uint64();
            break;
          }
          case 5: {
            message.internalExt = reader.string();
            break;
          }
          case 6: {
            message.fetchType = reader.uint32();
            break;
          }
          case 7: {
            if (message.routeParams === $util.emptyObject) message.routeParams = {};
            let end2 = reader.uint32() + reader.pos;
            key = "";
            value = "";
            while (reader.pos < end2) {
              let tag2 = reader.uint32();
              switch (tag2 >>> 3) {
                case 1:
                  key = reader.string();
                  break;
                case 2:
                  value = reader.string();
                  break;
                default:
                  reader.skipType(tag2 & 7);
                  break;
              }
            }
            message.routeParams[key] = value;
            break;
          }
          case 8: {
            message.heartbeatDuration = reader.uint64();
            break;
          }
          case 9: {
            message.needAck = reader.bool();
            break;
          }
          case 10: {
            message.pushServer = reader.string();
            break;
          }
          case 11: {
            message.liveCursor = reader.string();
            break;
          }
          case 12: {
            message.historyNoMore = reader.bool();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a Response message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.Response
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.Response} Response
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Response.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a Response message.
     * @function verify
     * @memberof douyin.Response
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Response.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.messagesList != null && message.hasOwnProperty("messagesList")) {
        if (!Array.isArray(message.messagesList)) return "messagesList: array expected";
        for (let i = 0; i < message.messagesList.length; ++i) {
          let error = $root.douyin.Message.verify(message.messagesList[i]);
          if (error) return "messagesList." + error;
        }
      }
      if (message.cursor != null && message.hasOwnProperty("cursor"))
        if (!$util.isString(message.cursor)) return "cursor: string expected";
      if (message.fetchInterval != null && message.hasOwnProperty("fetchInterval"))
        if (
          !$util.isInteger(message.fetchInterval) &&
          !(
            message.fetchInterval &&
            $util.isInteger(message.fetchInterval.low) &&
            $util.isInteger(message.fetchInterval.high)
          )
        )
          return "fetchInterval: integer|Long expected";
      if (message.now != null && message.hasOwnProperty("now"))
        if (
          !$util.isInteger(message.now) &&
          !(message.now && $util.isInteger(message.now.low) && $util.isInteger(message.now.high))
        )
          return "now: integer|Long expected";
      if (message.internalExt != null && message.hasOwnProperty("internalExt"))
        if (!$util.isString(message.internalExt)) return "internalExt: string expected";
      if (message.fetchType != null && message.hasOwnProperty("fetchType"))
        if (!$util.isInteger(message.fetchType)) return "fetchType: integer expected";
      if (message.routeParams != null && message.hasOwnProperty("routeParams")) {
        if (!$util.isObject(message.routeParams)) return "routeParams: object expected";
        let key = Object.keys(message.routeParams);
        for (let i = 0; i < key.length; ++i)
          if (!$util.isString(message.routeParams[key[i]]))
            return "routeParams: string{k:string} expected";
      }
      if (message.heartbeatDuration != null && message.hasOwnProperty("heartbeatDuration"))
        if (
          !$util.isInteger(message.heartbeatDuration) &&
          !(
            message.heartbeatDuration &&
            $util.isInteger(message.heartbeatDuration.low) &&
            $util.isInteger(message.heartbeatDuration.high)
          )
        )
          return "heartbeatDuration: integer|Long expected";
      if (message.needAck != null && message.hasOwnProperty("needAck"))
        if (typeof message.needAck !== "boolean") return "needAck: boolean expected";
      if (message.pushServer != null && message.hasOwnProperty("pushServer"))
        if (!$util.isString(message.pushServer)) return "pushServer: string expected";
      if (message.liveCursor != null && message.hasOwnProperty("liveCursor"))
        if (!$util.isString(message.liveCursor)) return "liveCursor: string expected";
      if (message.historyNoMore != null && message.hasOwnProperty("historyNoMore"))
        if (typeof message.historyNoMore !== "boolean") return "historyNoMore: boolean expected";
      return null;
    };

    /**
     * Creates a Response message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.Response
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.Response} Response
     */
    Response.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.Response) return object;
      let message = new $root.douyin.Response();
      if (object.messagesList) {
        if (!Array.isArray(object.messagesList))
          throw TypeError(".douyin.Response.messagesList: array expected");
        message.messagesList = [];
        for (let i = 0; i < object.messagesList.length; ++i) {
          if (typeof object.messagesList[i] !== "object")
            throw TypeError(".douyin.Response.messagesList: object expected");
          message.messagesList[i] = $root.douyin.Message.fromObject(object.messagesList[i]);
        }
      }
      if (object.cursor != null) message.cursor = String(object.cursor);
      if (object.fetchInterval != null)
        if ($util.Long)
          (message.fetchInterval = $util.Long.fromValue(object.fetchInterval)).unsigned = true;
        else if (typeof object.fetchInterval === "string")
          message.fetchInterval = parseInt(object.fetchInterval, 10);
        else if (typeof object.fetchInterval === "number")
          message.fetchInterval = object.fetchInterval;
        else if (typeof object.fetchInterval === "object")
          message.fetchInterval = new $util.LongBits(
            object.fetchInterval.low >>> 0,
            object.fetchInterval.high >>> 0,
          ).toNumber(true);
      if (object.now != null)
        if ($util.Long) (message.now = $util.Long.fromValue(object.now)).unsigned = true;
        else if (typeof object.now === "string") message.now = parseInt(object.now, 10);
        else if (typeof object.now === "number") message.now = object.now;
        else if (typeof object.now === "object")
          message.now = new $util.LongBits(object.now.low >>> 0, object.now.high >>> 0).toNumber(
            true,
          );
      if (object.internalExt != null) message.internalExt = String(object.internalExt);
      if (object.fetchType != null) message.fetchType = object.fetchType >>> 0;
      if (object.routeParams) {
        if (typeof object.routeParams !== "object")
          throw TypeError(".douyin.Response.routeParams: object expected");
        message.routeParams = {};
        for (let keys = Object.keys(object.routeParams), i = 0; i < keys.length; ++i)
          message.routeParams[keys[i]] = String(object.routeParams[keys[i]]);
      }
      if (object.heartbeatDuration != null)
        if ($util.Long)
          (message.heartbeatDuration = $util.Long.fromValue(object.heartbeatDuration)).unsigned =
            true;
        else if (typeof object.heartbeatDuration === "string")
          message.heartbeatDuration = parseInt(object.heartbeatDuration, 10);
        else if (typeof object.heartbeatDuration === "number")
          message.heartbeatDuration = object.heartbeatDuration;
        else if (typeof object.heartbeatDuration === "object")
          message.heartbeatDuration = new $util.LongBits(
            object.heartbeatDuration.low >>> 0,
            object.heartbeatDuration.high >>> 0,
          ).toNumber(true);
      if (object.needAck != null) message.needAck = Boolean(object.needAck);
      if (object.pushServer != null) message.pushServer = String(object.pushServer);
      if (object.liveCursor != null) message.liveCursor = String(object.liveCursor);
      if (object.historyNoMore != null) message.historyNoMore = Boolean(object.historyNoMore);
      return message;
    };

    /**
     * Creates a plain object from a Response message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.Response
     * @static
     * @param {douyin.Response} message Response
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Response.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.messagesList = [];
      if (options.objects || options.defaults) object.routeParams = {};
      if (options.defaults) {
        object.cursor = "";
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.fetchInterval =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.fetchInterval = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.now =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.now = options.longs === String ? "0" : 0;
        object.internalExt = "";
        object.fetchType = 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.heartbeatDuration =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.heartbeatDuration = options.longs === String ? "0" : 0;
        object.needAck = false;
        object.pushServer = "";
        object.liveCursor = "";
        object.historyNoMore = false;
      }
      if (message.messagesList && message.messagesList.length) {
        object.messagesList = [];
        for (let j = 0; j < message.messagesList.length; ++j)
          object.messagesList[j] = $root.douyin.Message.toObject(message.messagesList[j], options);
      }
      if (message.cursor != null && message.hasOwnProperty("cursor"))
        object.cursor = message.cursor;
      if (message.fetchInterval != null && message.hasOwnProperty("fetchInterval"))
        if (typeof message.fetchInterval === "number")
          object.fetchInterval =
            options.longs === String ? String(message.fetchInterval) : message.fetchInterval;
        else
          object.fetchInterval =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.fetchInterval)
              : options.longs === Number
                ? new $util.LongBits(
                    message.fetchInterval.low >>> 0,
                    message.fetchInterval.high >>> 0,
                  ).toNumber(true)
                : message.fetchInterval;
      if (message.now != null && message.hasOwnProperty("now"))
        if (typeof message.now === "number")
          object.now = options.longs === String ? String(message.now) : message.now;
        else
          object.now =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.now)
              : options.longs === Number
                ? new $util.LongBits(message.now.low >>> 0, message.now.high >>> 0).toNumber(true)
                : message.now;
      if (message.internalExt != null && message.hasOwnProperty("internalExt"))
        object.internalExt = message.internalExt;
      if (message.fetchType != null && message.hasOwnProperty("fetchType"))
        object.fetchType = message.fetchType;
      let keys2;
      if (message.routeParams && (keys2 = Object.keys(message.routeParams)).length) {
        object.routeParams = {};
        for (let j = 0; j < keys2.length; ++j)
          object.routeParams[keys2[j]] = message.routeParams[keys2[j]];
      }
      if (message.heartbeatDuration != null && message.hasOwnProperty("heartbeatDuration"))
        if (typeof message.heartbeatDuration === "number")
          object.heartbeatDuration =
            options.longs === String
              ? String(message.heartbeatDuration)
              : message.heartbeatDuration;
        else
          object.heartbeatDuration =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.heartbeatDuration)
              : options.longs === Number
                ? new $util.LongBits(
                    message.heartbeatDuration.low >>> 0,
                    message.heartbeatDuration.high >>> 0,
                  ).toNumber(true)
                : message.heartbeatDuration;
      if (message.needAck != null && message.hasOwnProperty("needAck"))
        object.needAck = message.needAck;
      if (message.pushServer != null && message.hasOwnProperty("pushServer"))
        object.pushServer = message.pushServer;
      if (message.liveCursor != null && message.hasOwnProperty("liveCursor"))
        object.liveCursor = message.liveCursor;
      if (message.historyNoMore != null && message.hasOwnProperty("historyNoMore"))
        object.historyNoMore = message.historyNoMore;
      return object;
    };

    /**
     * Converts this Response to JSON.
     * @function toJSON
     * @memberof douyin.Response
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Response.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Response
     * @function getTypeUrl
     * @memberof douyin.Response
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Response.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.Response";
    };

    return Response;
  })();

  douyin.Message = (function () {
    /**
     * Properties of a Message.
     * @memberof douyin
     * @interface IMessage
     * @property {string|null} [method] Message method
     * @property {Uint8Array|null} [payload] Message payload
     * @property {number|Long|null} [msgId] Message msgId
     * @property {number|null} [msgType] Message msgType
     * @property {number|Long|null} [offset] Message offset
     * @property {boolean|null} [needWrdsStore] Message needWrdsStore
     * @property {number|Long|null} [wrdsVersion] Message wrdsVersion
     * @property {string|null} [wrdsSubKey] Message wrdsSubKey
     */

    /**
     * Constructs a new Message.
     * @memberof douyin
     * @classdesc Represents a Message.
     * @implements IMessage
     * @constructor
     * @param {douyin.IMessage=} [properties] Properties to set
     */
    function Message(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * Message method.
     * @member {string} method
     * @memberof douyin.Message
     * @instance
     */
    Message.prototype.method = "";

    /**
     * Message payload.
     * @member {Uint8Array} payload
     * @memberof douyin.Message
     * @instance
     */
    Message.prototype.payload = $util.newBuffer([]);

    /**
     * Message msgId.
     * @member {number|Long} msgId
     * @memberof douyin.Message
     * @instance
     */
    Message.prototype.msgId = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;

    /**
     * Message msgType.
     * @member {number} msgType
     * @memberof douyin.Message
     * @instance
     */
    Message.prototype.msgType = 0;

    /**
     * Message offset.
     * @member {number|Long} offset
     * @memberof douyin.Message
     * @instance
     */
    Message.prototype.offset = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;

    /**
     * Message needWrdsStore.
     * @member {boolean} needWrdsStore
     * @memberof douyin.Message
     * @instance
     */
    Message.prototype.needWrdsStore = false;

    /**
     * Message wrdsVersion.
     * @member {number|Long} wrdsVersion
     * @memberof douyin.Message
     * @instance
     */
    Message.prototype.wrdsVersion = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;

    /**
     * Message wrdsSubKey.
     * @member {string} wrdsSubKey
     * @memberof douyin.Message
     * @instance
     */
    Message.prototype.wrdsSubKey = "";

    /**
     * Creates a new Message instance using the specified properties.
     * @function create
     * @memberof douyin.Message
     * @static
     * @param {douyin.IMessage=} [properties] Properties to set
     * @returns {douyin.Message} Message instance
     */
    Message.create = function create(properties) {
      return new Message(properties);
    };

    /**
     * Encodes the specified Message message. Does not implicitly {@link douyin.Message.verify|verify} messages.
     * @function encode
     * @memberof douyin.Message
     * @static
     * @param {douyin.IMessage} message Message message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Message.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.method != null && Object.hasOwnProperty.call(message, "method"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.method);
      if (message.payload != null && Object.hasOwnProperty.call(message, "payload"))
        writer.uint32(/* id 2, wireType 2 =*/ 18).bytes(message.payload);
      if (message.msgId != null && Object.hasOwnProperty.call(message, "msgId"))
        writer.uint32(/* id 3, wireType 0 =*/ 24).int64(message.msgId);
      if (message.msgType != null && Object.hasOwnProperty.call(message, "msgType"))
        writer.uint32(/* id 4, wireType 0 =*/ 32).int32(message.msgType);
      if (message.offset != null && Object.hasOwnProperty.call(message, "offset"))
        writer.uint32(/* id 5, wireType 0 =*/ 40).int64(message.offset);
      if (message.needWrdsStore != null && Object.hasOwnProperty.call(message, "needWrdsStore"))
        writer.uint32(/* id 6, wireType 0 =*/ 48).bool(message.needWrdsStore);
      if (message.wrdsVersion != null && Object.hasOwnProperty.call(message, "wrdsVersion"))
        writer.uint32(/* id 7, wireType 0 =*/ 56).int64(message.wrdsVersion);
      if (message.wrdsSubKey != null && Object.hasOwnProperty.call(message, "wrdsSubKey"))
        writer.uint32(/* id 8, wireType 2 =*/ 66).string(message.wrdsSubKey);
      return writer;
    };

    /**
     * Encodes the specified Message message, length delimited. Does not implicitly {@link douyin.Message.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.Message
     * @static
     * @param {douyin.IMessage} message Message message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Message.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a Message message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.Message
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.Message} Message
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Message.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.Message();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.method = reader.string();
            break;
          }
          case 2: {
            message.payload = reader.bytes();
            break;
          }
          case 3: {
            message.msgId = reader.int64();
            break;
          }
          case 4: {
            message.msgType = reader.int32();
            break;
          }
          case 5: {
            message.offset = reader.int64();
            break;
          }
          case 6: {
            message.needWrdsStore = reader.bool();
            break;
          }
          case 7: {
            message.wrdsVersion = reader.int64();
            break;
          }
          case 8: {
            message.wrdsSubKey = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a Message message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.Message
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.Message} Message
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Message.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a Message message.
     * @function verify
     * @memberof douyin.Message
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Message.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.method != null && message.hasOwnProperty("method"))
        if (!$util.isString(message.method)) return "method: string expected";
      if (message.payload != null && message.hasOwnProperty("payload"))
        if (
          !(
            (message.payload && typeof message.payload.length === "number") ||
            $util.isString(message.payload)
          )
        )
          return "payload: buffer expected";
      if (message.msgId != null && message.hasOwnProperty("msgId"))
        if (
          !$util.isInteger(message.msgId) &&
          !(
            message.msgId &&
            $util.isInteger(message.msgId.low) &&
            $util.isInteger(message.msgId.high)
          )
        )
          return "msgId: integer|Long expected";
      if (message.msgType != null && message.hasOwnProperty("msgType"))
        if (!$util.isInteger(message.msgType)) return "msgType: integer expected";
      if (message.offset != null && message.hasOwnProperty("offset"))
        if (
          !$util.isInteger(message.offset) &&
          !(
            message.offset &&
            $util.isInteger(message.offset.low) &&
            $util.isInteger(message.offset.high)
          )
        )
          return "offset: integer|Long expected";
      if (message.needWrdsStore != null && message.hasOwnProperty("needWrdsStore"))
        if (typeof message.needWrdsStore !== "boolean") return "needWrdsStore: boolean expected";
      if (message.wrdsVersion != null && message.hasOwnProperty("wrdsVersion"))
        if (
          !$util.isInteger(message.wrdsVersion) &&
          !(
            message.wrdsVersion &&
            $util.isInteger(message.wrdsVersion.low) &&
            $util.isInteger(message.wrdsVersion.high)
          )
        )
          return "wrdsVersion: integer|Long expected";
      if (message.wrdsSubKey != null && message.hasOwnProperty("wrdsSubKey"))
        if (!$util.isString(message.wrdsSubKey)) return "wrdsSubKey: string expected";
      return null;
    };

    /**
     * Creates a Message message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.Message
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.Message} Message
     */
    Message.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.Message) return object;
      let message = new $root.douyin.Message();
      if (object.method != null) message.method = String(object.method);
      if (object.payload != null)
        if (typeof object.payload === "string")
          $util.base64.decode(
            object.payload,
            (message.payload = $util.newBuffer($util.base64.length(object.payload))),
            0,
          );
        else if (object.payload.length >= 0) message.payload = object.payload;
      if (object.msgId != null)
        if ($util.Long) (message.msgId = $util.Long.fromValue(object.msgId)).unsigned = false;
        else if (typeof object.msgId === "string") message.msgId = parseInt(object.msgId, 10);
        else if (typeof object.msgId === "number") message.msgId = object.msgId;
        else if (typeof object.msgId === "object")
          message.msgId = new $util.LongBits(
            object.msgId.low >>> 0,
            object.msgId.high >>> 0,
          ).toNumber();
      if (object.msgType != null) message.msgType = object.msgType | 0;
      if (object.offset != null)
        if ($util.Long) (message.offset = $util.Long.fromValue(object.offset)).unsigned = false;
        else if (typeof object.offset === "string") message.offset = parseInt(object.offset, 10);
        else if (typeof object.offset === "number") message.offset = object.offset;
        else if (typeof object.offset === "object")
          message.offset = new $util.LongBits(
            object.offset.low >>> 0,
            object.offset.high >>> 0,
          ).toNumber();
      if (object.needWrdsStore != null) message.needWrdsStore = Boolean(object.needWrdsStore);
      if (object.wrdsVersion != null)
        if ($util.Long)
          (message.wrdsVersion = $util.Long.fromValue(object.wrdsVersion)).unsigned = false;
        else if (typeof object.wrdsVersion === "string")
          message.wrdsVersion = parseInt(object.wrdsVersion, 10);
        else if (typeof object.wrdsVersion === "number") message.wrdsVersion = object.wrdsVersion;
        else if (typeof object.wrdsVersion === "object")
          message.wrdsVersion = new $util.LongBits(
            object.wrdsVersion.low >>> 0,
            object.wrdsVersion.high >>> 0,
          ).toNumber();
      if (object.wrdsSubKey != null) message.wrdsSubKey = String(object.wrdsSubKey);
      return message;
    };

    /**
     * Creates a plain object from a Message message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.Message
     * @static
     * @param {douyin.Message} message Message
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Message.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.method = "";
        if (options.bytes === String) object.payload = "";
        else {
          object.payload = [];
          if (options.bytes !== Array) object.payload = $util.newBuffer(object.payload);
        }
        if ($util.Long) {
          let long = new $util.Long(0, 0, false);
          object.msgId =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.msgId = options.longs === String ? "0" : 0;
        object.msgType = 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, false);
          object.offset =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.offset = options.longs === String ? "0" : 0;
        object.needWrdsStore = false;
        if ($util.Long) {
          let long = new $util.Long(0, 0, false);
          object.wrdsVersion =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.wrdsVersion = options.longs === String ? "0" : 0;
        object.wrdsSubKey = "";
      }
      if (message.method != null && message.hasOwnProperty("method"))
        object.method = message.method;
      if (message.payload != null && message.hasOwnProperty("payload"))
        object.payload =
          options.bytes === String
            ? $util.base64.encode(message.payload, 0, message.payload.length)
            : options.bytes === Array
              ? Array.prototype.slice.call(message.payload)
              : message.payload;
      if (message.msgId != null && message.hasOwnProperty("msgId"))
        if (typeof message.msgId === "number")
          object.msgId = options.longs === String ? String(message.msgId) : message.msgId;
        else
          object.msgId =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.msgId)
              : options.longs === Number
                ? new $util.LongBits(message.msgId.low >>> 0, message.msgId.high >>> 0).toNumber()
                : message.msgId;
      if (message.msgType != null && message.hasOwnProperty("msgType"))
        object.msgType = message.msgType;
      if (message.offset != null && message.hasOwnProperty("offset"))
        if (typeof message.offset === "number")
          object.offset = options.longs === String ? String(message.offset) : message.offset;
        else
          object.offset =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.offset)
              : options.longs === Number
                ? new $util.LongBits(message.offset.low >>> 0, message.offset.high >>> 0).toNumber()
                : message.offset;
      if (message.needWrdsStore != null && message.hasOwnProperty("needWrdsStore"))
        object.needWrdsStore = message.needWrdsStore;
      if (message.wrdsVersion != null && message.hasOwnProperty("wrdsVersion"))
        if (typeof message.wrdsVersion === "number")
          object.wrdsVersion =
            options.longs === String ? String(message.wrdsVersion) : message.wrdsVersion;
        else
          object.wrdsVersion =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.wrdsVersion)
              : options.longs === Number
                ? new $util.LongBits(
                    message.wrdsVersion.low >>> 0,
                    message.wrdsVersion.high >>> 0,
                  ).toNumber()
                : message.wrdsVersion;
      if (message.wrdsSubKey != null && message.hasOwnProperty("wrdsSubKey"))
        object.wrdsSubKey = message.wrdsSubKey;
      return object;
    };

    /**
     * Converts this Message to JSON.
     * @function toJSON
     * @memberof douyin.Message
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Message.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Message
     * @function getTypeUrl
     * @memberof douyin.Message
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Message.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.Message";
    };

    return Message;
  })();

  douyin.ChatMessage = (function () {
    /**
     * Properties of a ChatMessage.
     * @memberof douyin
     * @interface IChatMessage
     * @property {douyin.ICommon|null} [common] ChatMessage common
     * @property {douyin.IUser|null} [user] ChatMessage user
     * @property {string|null} [content] ChatMessage content
     * @property {boolean|null} [visibleToSender] ChatMessage visibleToSender
     * @property {douyin.IImage|null} [backgroundImage] ChatMessage backgroundImage
     * @property {string|null} [fullScreenTextColor] ChatMessage fullScreenTextColor
     * @property {douyin.IImage|null} [backgroundImageV2] ChatMessage backgroundImageV2
     * @property {douyin.IPublicAreaCommon|null} [publicAreaCommon] ChatMessage publicAreaCommon
     * @property {douyin.IImage|null} [giftImage] ChatMessage giftImage
     * @property {number|Long|null} [agreeMsgId] ChatMessage agreeMsgId
     * @property {number|null} [priorityLevel] ChatMessage priorityLevel
     * @property {douyin.ILandscapeAreaCommon|null} [landscapeAreaCommon] ChatMessage landscapeAreaCommon
     * @property {number|Long|null} [eventTime] ChatMessage eventTime
     * @property {boolean|null} [sendReview] ChatMessage sendReview
     * @property {boolean|null} [fromIntercom] ChatMessage fromIntercom
     * @property {boolean|null} [intercomHideUserCard] ChatMessage intercomHideUserCard
     * @property {Array.<number>|null} [chatTags] ChatMessage chatTags
     * @property {string|null} [chatBy] ChatMessage chatBy
     * @property {number|null} [individualChatPriority] ChatMessage individualChatPriority
     * @property {douyin.IText|null} [rtfContent] ChatMessage rtfContent
     * @property {douyin.IText|null} [rtfContentV2] ChatMessage rtfContentV2
     */

    /**
     * Constructs a new ChatMessage.
     * @memberof douyin
     * @classdesc Represents a ChatMessage.
     * @implements IChatMessage
     * @constructor
     * @param {douyin.IChatMessage=} [properties] Properties to set
     */
    function ChatMessage(properties) {
      this.chatTags = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * ChatMessage common.
     * @member {douyin.ICommon|null|undefined} common
     * @memberof douyin.ChatMessage
     * @instance
     */
    ChatMessage.prototype.common = null;

    /**
     * ChatMessage user.
     * @member {douyin.IUser|null|undefined} user
     * @memberof douyin.ChatMessage
     * @instance
     */
    ChatMessage.prototype.user = null;

    /**
     * ChatMessage content.
     * @member {string} content
     * @memberof douyin.ChatMessage
     * @instance
     */
    ChatMessage.prototype.content = "";

    /**
     * ChatMessage visibleToSender.
     * @member {boolean} visibleToSender
     * @memberof douyin.ChatMessage
     * @instance
     */
    ChatMessage.prototype.visibleToSender = false;

    /**
     * ChatMessage backgroundImage.
     * @member {douyin.IImage|null|undefined} backgroundImage
     * @memberof douyin.ChatMessage
     * @instance
     */
    ChatMessage.prototype.backgroundImage = null;

    /**
     * ChatMessage fullScreenTextColor.
     * @member {string} fullScreenTextColor
     * @memberof douyin.ChatMessage
     * @instance
     */
    ChatMessage.prototype.fullScreenTextColor = "";

    /**
     * ChatMessage backgroundImageV2.
     * @member {douyin.IImage|null|undefined} backgroundImageV2
     * @memberof douyin.ChatMessage
     * @instance
     */
    ChatMessage.prototype.backgroundImageV2 = null;

    /**
     * ChatMessage publicAreaCommon.
     * @member {douyin.IPublicAreaCommon|null|undefined} publicAreaCommon
     * @memberof douyin.ChatMessage
     * @instance
     */
    ChatMessage.prototype.publicAreaCommon = null;

    /**
     * ChatMessage giftImage.
     * @member {douyin.IImage|null|undefined} giftImage
     * @memberof douyin.ChatMessage
     * @instance
     */
    ChatMessage.prototype.giftImage = null;

    /**
     * ChatMessage agreeMsgId.
     * @member {number|Long} agreeMsgId
     * @memberof douyin.ChatMessage
     * @instance
     */
    ChatMessage.prototype.agreeMsgId = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * ChatMessage priorityLevel.
     * @member {number} priorityLevel
     * @memberof douyin.ChatMessage
     * @instance
     */
    ChatMessage.prototype.priorityLevel = 0;

    /**
     * ChatMessage landscapeAreaCommon.
     * @member {douyin.ILandscapeAreaCommon|null|undefined} landscapeAreaCommon
     * @memberof douyin.ChatMessage
     * @instance
     */
    ChatMessage.prototype.landscapeAreaCommon = null;

    /**
     * ChatMessage eventTime.
     * @member {number|Long} eventTime
     * @memberof douyin.ChatMessage
     * @instance
     */
    ChatMessage.prototype.eventTime = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * ChatMessage sendReview.
     * @member {boolean} sendReview
     * @memberof douyin.ChatMessage
     * @instance
     */
    ChatMessage.prototype.sendReview = false;

    /**
     * ChatMessage fromIntercom.
     * @member {boolean} fromIntercom
     * @memberof douyin.ChatMessage
     * @instance
     */
    ChatMessage.prototype.fromIntercom = false;

    /**
     * ChatMessage intercomHideUserCard.
     * @member {boolean} intercomHideUserCard
     * @memberof douyin.ChatMessage
     * @instance
     */
    ChatMessage.prototype.intercomHideUserCard = false;

    /**
     * ChatMessage chatTags.
     * @member {Array.<number>} chatTags
     * @memberof douyin.ChatMessage
     * @instance
     */
    ChatMessage.prototype.chatTags = $util.emptyArray;

    /**
     * ChatMessage chatBy.
     * @member {string} chatBy
     * @memberof douyin.ChatMessage
     * @instance
     */
    ChatMessage.prototype.chatBy = "";

    /**
     * ChatMessage individualChatPriority.
     * @member {number} individualChatPriority
     * @memberof douyin.ChatMessage
     * @instance
     */
    ChatMessage.prototype.individualChatPriority = 0;

    /**
     * ChatMessage rtfContent.
     * @member {douyin.IText|null|undefined} rtfContent
     * @memberof douyin.ChatMessage
     * @instance
     */
    ChatMessage.prototype.rtfContent = null;

    /**
     * ChatMessage rtfContentV2.
     * @member {douyin.IText|null|undefined} rtfContentV2
     * @memberof douyin.ChatMessage
     * @instance
     */
    ChatMessage.prototype.rtfContentV2 = null;

    /**
     * Creates a new ChatMessage instance using the specified properties.
     * @function create
     * @memberof douyin.ChatMessage
     * @static
     * @param {douyin.IChatMessage=} [properties] Properties to set
     * @returns {douyin.ChatMessage} ChatMessage instance
     */
    ChatMessage.create = function create(properties) {
      return new ChatMessage(properties);
    };

    /**
     * Encodes the specified ChatMessage message. Does not implicitly {@link douyin.ChatMessage.verify|verify} messages.
     * @function encode
     * @memberof douyin.ChatMessage
     * @static
     * @param {douyin.IChatMessage} message ChatMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ChatMessage.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.common != null && Object.hasOwnProperty.call(message, "common"))
        $root.douyin.Common.encode(
          message.common,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (message.user != null && Object.hasOwnProperty.call(message, "user"))
        $root.douyin.User.encode(
          message.user,
          writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
        ).ldelim();
      if (message.content != null && Object.hasOwnProperty.call(message, "content"))
        writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.content);
      if (message.visibleToSender != null && Object.hasOwnProperty.call(message, "visibleToSender"))
        writer.uint32(/* id 4, wireType 0 =*/ 32).bool(message.visibleToSender);
      if (message.backgroundImage != null && Object.hasOwnProperty.call(message, "backgroundImage"))
        $root.douyin.Image.encode(
          message.backgroundImage,
          writer.uint32(/* id 5, wireType 2 =*/ 42).fork(),
        ).ldelim();
      if (
        message.fullScreenTextColor != null &&
        Object.hasOwnProperty.call(message, "fullScreenTextColor")
      )
        writer.uint32(/* id 6, wireType 2 =*/ 50).string(message.fullScreenTextColor);
      if (
        message.backgroundImageV2 != null &&
        Object.hasOwnProperty.call(message, "backgroundImageV2")
      )
        $root.douyin.Image.encode(
          message.backgroundImageV2,
          writer.uint32(/* id 7, wireType 2 =*/ 58).fork(),
        ).ldelim();
      if (
        message.publicAreaCommon != null &&
        Object.hasOwnProperty.call(message, "publicAreaCommon")
      )
        $root.douyin.PublicAreaCommon.encode(
          message.publicAreaCommon,
          writer.uint32(/* id 8, wireType 2 =*/ 66).fork(),
        ).ldelim();
      if (message.giftImage != null && Object.hasOwnProperty.call(message, "giftImage"))
        $root.douyin.Image.encode(
          message.giftImage,
          writer.uint32(/* id 9, wireType 2 =*/ 74).fork(),
        ).ldelim();
      if (message.agreeMsgId != null && Object.hasOwnProperty.call(message, "agreeMsgId"))
        writer.uint32(/* id 11, wireType 0 =*/ 88).uint64(message.agreeMsgId);
      if (message.priorityLevel != null && Object.hasOwnProperty.call(message, "priorityLevel"))
        writer.uint32(/* id 12, wireType 0 =*/ 96).uint32(message.priorityLevel);
      if (
        message.landscapeAreaCommon != null &&
        Object.hasOwnProperty.call(message, "landscapeAreaCommon")
      )
        $root.douyin.LandscapeAreaCommon.encode(
          message.landscapeAreaCommon,
          writer.uint32(/* id 13, wireType 2 =*/ 106).fork(),
        ).ldelim();
      if (message.eventTime != null && Object.hasOwnProperty.call(message, "eventTime"))
        writer.uint32(/* id 15, wireType 0 =*/ 120).uint64(message.eventTime);
      if (message.sendReview != null && Object.hasOwnProperty.call(message, "sendReview"))
        writer.uint32(/* id 16, wireType 0 =*/ 128).bool(message.sendReview);
      if (message.fromIntercom != null && Object.hasOwnProperty.call(message, "fromIntercom"))
        writer.uint32(/* id 17, wireType 0 =*/ 136).bool(message.fromIntercom);
      if (
        message.intercomHideUserCard != null &&
        Object.hasOwnProperty.call(message, "intercomHideUserCard")
      )
        writer.uint32(/* id 18, wireType 0 =*/ 144).bool(message.intercomHideUserCard);
      if (message.chatTags != null && message.chatTags.length) {
        writer.uint32(/* id 19, wireType 2 =*/ 154).fork();
        for (let i = 0; i < message.chatTags.length; ++i) writer.uint32(message.chatTags[i]);
        writer.ldelim();
      }
      if (message.chatBy != null && Object.hasOwnProperty.call(message, "chatBy"))
        writer.uint32(/* id 20, wireType 2 =*/ 162).string(message.chatBy);
      if (
        message.individualChatPriority != null &&
        Object.hasOwnProperty.call(message, "individualChatPriority")
      )
        writer.uint32(/* id 21, wireType 0 =*/ 168).uint32(message.individualChatPriority);
      if (message.rtfContent != null && Object.hasOwnProperty.call(message, "rtfContent"))
        $root.douyin.Text.encode(
          message.rtfContent,
          writer.uint32(/* id 40, wireType 2 =*/ 322).fork(),
        ).ldelim();
      if (message.rtfContentV2 != null && Object.hasOwnProperty.call(message, "rtfContentV2"))
        $root.douyin.Text.encode(
          message.rtfContentV2,
          writer.uint32(/* id 42, wireType 2 =*/ 338).fork(),
        ).ldelim();
      return writer;
    };

    /**
     * Encodes the specified ChatMessage message, length delimited. Does not implicitly {@link douyin.ChatMessage.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.ChatMessage
     * @static
     * @param {douyin.IChatMessage} message ChatMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ChatMessage.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a ChatMessage message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.ChatMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.ChatMessage} ChatMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ChatMessage.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.ChatMessage();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.common = $root.douyin.Common.decode(reader, reader.uint32());
            break;
          }
          case 2: {
            message.user = $root.douyin.User.decode(reader, reader.uint32());
            break;
          }
          case 3: {
            message.content = reader.string();
            break;
          }
          case 4: {
            message.visibleToSender = reader.bool();
            break;
          }
          case 5: {
            message.backgroundImage = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 6: {
            message.fullScreenTextColor = reader.string();
            break;
          }
          case 7: {
            message.backgroundImageV2 = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 8: {
            message.publicAreaCommon = $root.douyin.PublicAreaCommon.decode(
              reader,
              reader.uint32(),
            );
            break;
          }
          case 9: {
            message.giftImage = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 11: {
            message.agreeMsgId = reader.uint64();
            break;
          }
          case 12: {
            message.priorityLevel = reader.uint32();
            break;
          }
          case 13: {
            message.landscapeAreaCommon = $root.douyin.LandscapeAreaCommon.decode(
              reader,
              reader.uint32(),
            );
            break;
          }
          case 15: {
            message.eventTime = reader.uint64();
            break;
          }
          case 16: {
            message.sendReview = reader.bool();
            break;
          }
          case 17: {
            message.fromIntercom = reader.bool();
            break;
          }
          case 18: {
            message.intercomHideUserCard = reader.bool();
            break;
          }
          case 19: {
            if (!(message.chatTags && message.chatTags.length)) message.chatTags = [];
            if ((tag & 7) === 2) {
              let end2 = reader.uint32() + reader.pos;
              while (reader.pos < end2) message.chatTags.push(reader.uint32());
            } else message.chatTags.push(reader.uint32());
            break;
          }
          case 20: {
            message.chatBy = reader.string();
            break;
          }
          case 21: {
            message.individualChatPriority = reader.uint32();
            break;
          }
          case 40: {
            message.rtfContent = $root.douyin.Text.decode(reader, reader.uint32());
            break;
          }
          case 42: {
            message.rtfContentV2 = $root.douyin.Text.decode(reader, reader.uint32());
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a ChatMessage message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.ChatMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.ChatMessage} ChatMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ChatMessage.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a ChatMessage message.
     * @function verify
     * @memberof douyin.ChatMessage
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ChatMessage.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.common != null && message.hasOwnProperty("common")) {
        let error = $root.douyin.Common.verify(message.common);
        if (error) return "common." + error;
      }
      if (message.user != null && message.hasOwnProperty("user")) {
        let error = $root.douyin.User.verify(message.user);
        if (error) return "user." + error;
      }
      if (message.content != null && message.hasOwnProperty("content"))
        if (!$util.isString(message.content)) return "content: string expected";
      if (message.visibleToSender != null && message.hasOwnProperty("visibleToSender"))
        if (typeof message.visibleToSender !== "boolean")
          return "visibleToSender: boolean expected";
      if (message.backgroundImage != null && message.hasOwnProperty("backgroundImage")) {
        let error = $root.douyin.Image.verify(message.backgroundImage);
        if (error) return "backgroundImage." + error;
      }
      if (message.fullScreenTextColor != null && message.hasOwnProperty("fullScreenTextColor"))
        if (!$util.isString(message.fullScreenTextColor))
          return "fullScreenTextColor: string expected";
      if (message.backgroundImageV2 != null && message.hasOwnProperty("backgroundImageV2")) {
        let error = $root.douyin.Image.verify(message.backgroundImageV2);
        if (error) return "backgroundImageV2." + error;
      }
      if (message.publicAreaCommon != null && message.hasOwnProperty("publicAreaCommon")) {
        let error = $root.douyin.PublicAreaCommon.verify(message.publicAreaCommon);
        if (error) return "publicAreaCommon." + error;
      }
      if (message.giftImage != null && message.hasOwnProperty("giftImage")) {
        let error = $root.douyin.Image.verify(message.giftImage);
        if (error) return "giftImage." + error;
      }
      if (message.agreeMsgId != null && message.hasOwnProperty("agreeMsgId"))
        if (
          !$util.isInteger(message.agreeMsgId) &&
          !(
            message.agreeMsgId &&
            $util.isInteger(message.agreeMsgId.low) &&
            $util.isInteger(message.agreeMsgId.high)
          )
        )
          return "agreeMsgId: integer|Long expected";
      if (message.priorityLevel != null && message.hasOwnProperty("priorityLevel"))
        if (!$util.isInteger(message.priorityLevel)) return "priorityLevel: integer expected";
      if (message.landscapeAreaCommon != null && message.hasOwnProperty("landscapeAreaCommon")) {
        let error = $root.douyin.LandscapeAreaCommon.verify(message.landscapeAreaCommon);
        if (error) return "landscapeAreaCommon." + error;
      }
      if (message.eventTime != null && message.hasOwnProperty("eventTime"))
        if (
          !$util.isInteger(message.eventTime) &&
          !(
            message.eventTime &&
            $util.isInteger(message.eventTime.low) &&
            $util.isInteger(message.eventTime.high)
          )
        )
          return "eventTime: integer|Long expected";
      if (message.sendReview != null && message.hasOwnProperty("sendReview"))
        if (typeof message.sendReview !== "boolean") return "sendReview: boolean expected";
      if (message.fromIntercom != null && message.hasOwnProperty("fromIntercom"))
        if (typeof message.fromIntercom !== "boolean") return "fromIntercom: boolean expected";
      if (message.intercomHideUserCard != null && message.hasOwnProperty("intercomHideUserCard"))
        if (typeof message.intercomHideUserCard !== "boolean")
          return "intercomHideUserCard: boolean expected";
      if (message.chatTags != null && message.hasOwnProperty("chatTags")) {
        if (!Array.isArray(message.chatTags)) return "chatTags: array expected";
        for (let i = 0; i < message.chatTags.length; ++i)
          if (!$util.isInteger(message.chatTags[i])) return "chatTags: integer[] expected";
      }
      if (message.chatBy != null && message.hasOwnProperty("chatBy"))
        if (!$util.isString(message.chatBy)) return "chatBy: string expected";
      if (
        message.individualChatPriority != null &&
        message.hasOwnProperty("individualChatPriority")
      )
        if (!$util.isInteger(message.individualChatPriority))
          return "individualChatPriority: integer expected";
      if (message.rtfContent != null && message.hasOwnProperty("rtfContent")) {
        let error = $root.douyin.Text.verify(message.rtfContent);
        if (error) return "rtfContent." + error;
      }
      if (message.rtfContentV2 != null && message.hasOwnProperty("rtfContentV2")) {
        let error = $root.douyin.Text.verify(message.rtfContentV2);
        if (error) return "rtfContentV2." + error;
      }
      return null;
    };

    /**
     * Creates a ChatMessage message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.ChatMessage
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.ChatMessage} ChatMessage
     */
    ChatMessage.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.ChatMessage) return object;
      let message = new $root.douyin.ChatMessage();
      if (object.common != null) {
        if (typeof object.common !== "object")
          throw TypeError(".douyin.ChatMessage.common: object expected");
        message.common = $root.douyin.Common.fromObject(object.common);
      }
      if (object.user != null) {
        if (typeof object.user !== "object")
          throw TypeError(".douyin.ChatMessage.user: object expected");
        message.user = $root.douyin.User.fromObject(object.user);
      }
      if (object.content != null) message.content = String(object.content);
      if (object.visibleToSender != null) message.visibleToSender = Boolean(object.visibleToSender);
      if (object.backgroundImage != null) {
        if (typeof object.backgroundImage !== "object")
          throw TypeError(".douyin.ChatMessage.backgroundImage: object expected");
        message.backgroundImage = $root.douyin.Image.fromObject(object.backgroundImage);
      }
      if (object.fullScreenTextColor != null)
        message.fullScreenTextColor = String(object.fullScreenTextColor);
      if (object.backgroundImageV2 != null) {
        if (typeof object.backgroundImageV2 !== "object")
          throw TypeError(".douyin.ChatMessage.backgroundImageV2: object expected");
        message.backgroundImageV2 = $root.douyin.Image.fromObject(object.backgroundImageV2);
      }
      if (object.publicAreaCommon != null) {
        if (typeof object.publicAreaCommon !== "object")
          throw TypeError(".douyin.ChatMessage.publicAreaCommon: object expected");
        message.publicAreaCommon = $root.douyin.PublicAreaCommon.fromObject(
          object.publicAreaCommon,
        );
      }
      if (object.giftImage != null) {
        if (typeof object.giftImage !== "object")
          throw TypeError(".douyin.ChatMessage.giftImage: object expected");
        message.giftImage = $root.douyin.Image.fromObject(object.giftImage);
      }
      if (object.agreeMsgId != null)
        if ($util.Long)
          (message.agreeMsgId = $util.Long.fromValue(object.agreeMsgId)).unsigned = true;
        else if (typeof object.agreeMsgId === "string")
          message.agreeMsgId = parseInt(object.agreeMsgId, 10);
        else if (typeof object.agreeMsgId === "number") message.agreeMsgId = object.agreeMsgId;
        else if (typeof object.agreeMsgId === "object")
          message.agreeMsgId = new $util.LongBits(
            object.agreeMsgId.low >>> 0,
            object.agreeMsgId.high >>> 0,
          ).toNumber(true);
      if (object.priorityLevel != null) message.priorityLevel = object.priorityLevel >>> 0;
      if (object.landscapeAreaCommon != null) {
        if (typeof object.landscapeAreaCommon !== "object")
          throw TypeError(".douyin.ChatMessage.landscapeAreaCommon: object expected");
        message.landscapeAreaCommon = $root.douyin.LandscapeAreaCommon.fromObject(
          object.landscapeAreaCommon,
        );
      }
      if (object.eventTime != null)
        if ($util.Long)
          (message.eventTime = $util.Long.fromValue(object.eventTime)).unsigned = true;
        else if (typeof object.eventTime === "string")
          message.eventTime = parseInt(object.eventTime, 10);
        else if (typeof object.eventTime === "number") message.eventTime = object.eventTime;
        else if (typeof object.eventTime === "object")
          message.eventTime = new $util.LongBits(
            object.eventTime.low >>> 0,
            object.eventTime.high >>> 0,
          ).toNumber(true);
      if (object.sendReview != null) message.sendReview = Boolean(object.sendReview);
      if (object.fromIntercom != null) message.fromIntercom = Boolean(object.fromIntercom);
      if (object.intercomHideUserCard != null)
        message.intercomHideUserCard = Boolean(object.intercomHideUserCard);
      if (object.chatTags) {
        if (!Array.isArray(object.chatTags))
          throw TypeError(".douyin.ChatMessage.chatTags: array expected");
        message.chatTags = [];
        for (let i = 0; i < object.chatTags.length; ++i)
          message.chatTags[i] = object.chatTags[i] >>> 0;
      }
      if (object.chatBy != null) message.chatBy = String(object.chatBy);
      if (object.individualChatPriority != null)
        message.individualChatPriority = object.individualChatPriority >>> 0;
      if (object.rtfContent != null) {
        if (typeof object.rtfContent !== "object")
          throw TypeError(".douyin.ChatMessage.rtfContent: object expected");
        message.rtfContent = $root.douyin.Text.fromObject(object.rtfContent);
      }
      if (object.rtfContentV2 != null) {
        if (typeof object.rtfContentV2 !== "object")
          throw TypeError(".douyin.ChatMessage.rtfContentV2: object expected");
        message.rtfContentV2 = $root.douyin.Text.fromObject(object.rtfContentV2);
      }
      return message;
    };

    /**
     * Creates a plain object from a ChatMessage message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.ChatMessage
     * @static
     * @param {douyin.ChatMessage} message ChatMessage
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ChatMessage.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.chatTags = [];
      if (options.defaults) {
        object.common = null;
        object.user = null;
        object.content = "";
        object.visibleToSender = false;
        object.backgroundImage = null;
        object.fullScreenTextColor = "";
        object.backgroundImageV2 = null;
        object.publicAreaCommon = null;
        object.giftImage = null;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.agreeMsgId =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.agreeMsgId = options.longs === String ? "0" : 0;
        object.priorityLevel = 0;
        object.landscapeAreaCommon = null;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.eventTime =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.eventTime = options.longs === String ? "0" : 0;
        object.sendReview = false;
        object.fromIntercom = false;
        object.intercomHideUserCard = false;
        object.chatBy = "";
        object.individualChatPriority = 0;
        object.rtfContent = null;
        object.rtfContentV2 = null;
      }
      if (message.common != null && message.hasOwnProperty("common"))
        object.common = $root.douyin.Common.toObject(message.common, options);
      if (message.user != null && message.hasOwnProperty("user"))
        object.user = $root.douyin.User.toObject(message.user, options);
      if (message.content != null && message.hasOwnProperty("content"))
        object.content = message.content;
      if (message.visibleToSender != null && message.hasOwnProperty("visibleToSender"))
        object.visibleToSender = message.visibleToSender;
      if (message.backgroundImage != null && message.hasOwnProperty("backgroundImage"))
        object.backgroundImage = $root.douyin.Image.toObject(message.backgroundImage, options);
      if (message.fullScreenTextColor != null && message.hasOwnProperty("fullScreenTextColor"))
        object.fullScreenTextColor = message.fullScreenTextColor;
      if (message.backgroundImageV2 != null && message.hasOwnProperty("backgroundImageV2"))
        object.backgroundImageV2 = $root.douyin.Image.toObject(message.backgroundImageV2, options);
      if (message.publicAreaCommon != null && message.hasOwnProperty("publicAreaCommon"))
        object.publicAreaCommon = $root.douyin.PublicAreaCommon.toObject(
          message.publicAreaCommon,
          options,
        );
      if (message.giftImage != null && message.hasOwnProperty("giftImage"))
        object.giftImage = $root.douyin.Image.toObject(message.giftImage, options);
      if (message.agreeMsgId != null && message.hasOwnProperty("agreeMsgId"))
        if (typeof message.agreeMsgId === "number")
          object.agreeMsgId =
            options.longs === String ? String(message.agreeMsgId) : message.agreeMsgId;
        else
          object.agreeMsgId =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.agreeMsgId)
              : options.longs === Number
                ? new $util.LongBits(
                    message.agreeMsgId.low >>> 0,
                    message.agreeMsgId.high >>> 0,
                  ).toNumber(true)
                : message.agreeMsgId;
      if (message.priorityLevel != null && message.hasOwnProperty("priorityLevel"))
        object.priorityLevel = message.priorityLevel;
      if (message.landscapeAreaCommon != null && message.hasOwnProperty("landscapeAreaCommon"))
        object.landscapeAreaCommon = $root.douyin.LandscapeAreaCommon.toObject(
          message.landscapeAreaCommon,
          options,
        );
      if (message.eventTime != null && message.hasOwnProperty("eventTime"))
        if (typeof message.eventTime === "number")
          object.eventTime =
            options.longs === String ? String(message.eventTime) : message.eventTime;
        else
          object.eventTime =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.eventTime)
              : options.longs === Number
                ? new $util.LongBits(
                    message.eventTime.low >>> 0,
                    message.eventTime.high >>> 0,
                  ).toNumber(true)
                : message.eventTime;
      if (message.sendReview != null && message.hasOwnProperty("sendReview"))
        object.sendReview = message.sendReview;
      if (message.fromIntercom != null && message.hasOwnProperty("fromIntercom"))
        object.fromIntercom = message.fromIntercom;
      if (message.intercomHideUserCard != null && message.hasOwnProperty("intercomHideUserCard"))
        object.intercomHideUserCard = message.intercomHideUserCard;
      if (message.chatTags && message.chatTags.length) {
        object.chatTags = [];
        for (let j = 0; j < message.chatTags.length; ++j) object.chatTags[j] = message.chatTags[j];
      }
      if (message.chatBy != null && message.hasOwnProperty("chatBy"))
        object.chatBy = message.chatBy;
      if (
        message.individualChatPriority != null &&
        message.hasOwnProperty("individualChatPriority")
      )
        object.individualChatPriority = message.individualChatPriority;
      if (message.rtfContent != null && message.hasOwnProperty("rtfContent"))
        object.rtfContent = $root.douyin.Text.toObject(message.rtfContent, options);
      if (message.rtfContentV2 != null && message.hasOwnProperty("rtfContentV2"))
        object.rtfContentV2 = $root.douyin.Text.toObject(message.rtfContentV2, options);
      return object;
    };

    /**
     * Converts this ChatMessage to JSON.
     * @function toJSON
     * @memberof douyin.ChatMessage
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ChatMessage.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for ChatMessage
     * @function getTypeUrl
     * @memberof douyin.ChatMessage
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    ChatMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.ChatMessage";
    };

    return ChatMessage;
  })();

  douyin.LandscapeAreaCommon = (function () {
    /**
     * Properties of a LandscapeAreaCommon.
     * @memberof douyin
     * @interface ILandscapeAreaCommon
     * @property {boolean|null} [showHead] LandscapeAreaCommon showHead
     * @property {boolean|null} [showNickname] LandscapeAreaCommon showNickname
     * @property {boolean|null} [showFontColor] LandscapeAreaCommon showFontColor
     * @property {Array.<string>|null} [colorValueList] LandscapeAreaCommon colorValueList
     * @property {Array.<douyin.CommentTypeTag>|null} [commentTypeTagsList] LandscapeAreaCommon commentTypeTagsList
     */

    /**
     * Constructs a new LandscapeAreaCommon.
     * @memberof douyin
     * @classdesc Represents a LandscapeAreaCommon.
     * @implements ILandscapeAreaCommon
     * @constructor
     * @param {douyin.ILandscapeAreaCommon=} [properties] Properties to set
     */
    function LandscapeAreaCommon(properties) {
      this.colorValueList = [];
      this.commentTypeTagsList = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * LandscapeAreaCommon showHead.
     * @member {boolean} showHead
     * @memberof douyin.LandscapeAreaCommon
     * @instance
     */
    LandscapeAreaCommon.prototype.showHead = false;

    /**
     * LandscapeAreaCommon showNickname.
     * @member {boolean} showNickname
     * @memberof douyin.LandscapeAreaCommon
     * @instance
     */
    LandscapeAreaCommon.prototype.showNickname = false;

    /**
     * LandscapeAreaCommon showFontColor.
     * @member {boolean} showFontColor
     * @memberof douyin.LandscapeAreaCommon
     * @instance
     */
    LandscapeAreaCommon.prototype.showFontColor = false;

    /**
     * LandscapeAreaCommon colorValueList.
     * @member {Array.<string>} colorValueList
     * @memberof douyin.LandscapeAreaCommon
     * @instance
     */
    LandscapeAreaCommon.prototype.colorValueList = $util.emptyArray;

    /**
     * LandscapeAreaCommon commentTypeTagsList.
     * @member {Array.<douyin.CommentTypeTag>} commentTypeTagsList
     * @memberof douyin.LandscapeAreaCommon
     * @instance
     */
    LandscapeAreaCommon.prototype.commentTypeTagsList = $util.emptyArray;

    /**
     * Creates a new LandscapeAreaCommon instance using the specified properties.
     * @function create
     * @memberof douyin.LandscapeAreaCommon
     * @static
     * @param {douyin.ILandscapeAreaCommon=} [properties] Properties to set
     * @returns {douyin.LandscapeAreaCommon} LandscapeAreaCommon instance
     */
    LandscapeAreaCommon.create = function create(properties) {
      return new LandscapeAreaCommon(properties);
    };

    /**
     * Encodes the specified LandscapeAreaCommon message. Does not implicitly {@link douyin.LandscapeAreaCommon.verify|verify} messages.
     * @function encode
     * @memberof douyin.LandscapeAreaCommon
     * @static
     * @param {douyin.ILandscapeAreaCommon} message LandscapeAreaCommon message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    LandscapeAreaCommon.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.showHead != null && Object.hasOwnProperty.call(message, "showHead"))
        writer.uint32(/* id 1, wireType 0 =*/ 8).bool(message.showHead);
      if (message.showNickname != null && Object.hasOwnProperty.call(message, "showNickname"))
        writer.uint32(/* id 2, wireType 0 =*/ 16).bool(message.showNickname);
      if (message.showFontColor != null && Object.hasOwnProperty.call(message, "showFontColor"))
        writer.uint32(/* id 3, wireType 0 =*/ 24).bool(message.showFontColor);
      if (message.colorValueList != null && message.colorValueList.length)
        for (let i = 0; i < message.colorValueList.length; ++i)
          writer.uint32(/* id 4, wireType 2 =*/ 34).string(message.colorValueList[i]);
      if (message.commentTypeTagsList != null && message.commentTypeTagsList.length) {
        writer.uint32(/* id 5, wireType 2 =*/ 42).fork();
        for (let i = 0; i < message.commentTypeTagsList.length; ++i)
          writer.int32(message.commentTypeTagsList[i]);
        writer.ldelim();
      }
      return writer;
    };

    /**
     * Encodes the specified LandscapeAreaCommon message, length delimited. Does not implicitly {@link douyin.LandscapeAreaCommon.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.LandscapeAreaCommon
     * @static
     * @param {douyin.ILandscapeAreaCommon} message LandscapeAreaCommon message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    LandscapeAreaCommon.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a LandscapeAreaCommon message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.LandscapeAreaCommon
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.LandscapeAreaCommon} LandscapeAreaCommon
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    LandscapeAreaCommon.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.LandscapeAreaCommon();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.showHead = reader.bool();
            break;
          }
          case 2: {
            message.showNickname = reader.bool();
            break;
          }
          case 3: {
            message.showFontColor = reader.bool();
            break;
          }
          case 4: {
            if (!(message.colorValueList && message.colorValueList.length))
              message.colorValueList = [];
            message.colorValueList.push(reader.string());
            break;
          }
          case 5: {
            if (!(message.commentTypeTagsList && message.commentTypeTagsList.length))
              message.commentTypeTagsList = [];
            if ((tag & 7) === 2) {
              let end2 = reader.uint32() + reader.pos;
              while (reader.pos < end2) message.commentTypeTagsList.push(reader.int32());
            } else message.commentTypeTagsList.push(reader.int32());
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a LandscapeAreaCommon message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.LandscapeAreaCommon
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.LandscapeAreaCommon} LandscapeAreaCommon
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    LandscapeAreaCommon.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a LandscapeAreaCommon message.
     * @function verify
     * @memberof douyin.LandscapeAreaCommon
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    LandscapeAreaCommon.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.showHead != null && message.hasOwnProperty("showHead"))
        if (typeof message.showHead !== "boolean") return "showHead: boolean expected";
      if (message.showNickname != null && message.hasOwnProperty("showNickname"))
        if (typeof message.showNickname !== "boolean") return "showNickname: boolean expected";
      if (message.showFontColor != null && message.hasOwnProperty("showFontColor"))
        if (typeof message.showFontColor !== "boolean") return "showFontColor: boolean expected";
      if (message.colorValueList != null && message.hasOwnProperty("colorValueList")) {
        if (!Array.isArray(message.colorValueList)) return "colorValueList: array expected";
        for (let i = 0; i < message.colorValueList.length; ++i)
          if (!$util.isString(message.colorValueList[i]))
            return "colorValueList: string[] expected";
      }
      if (message.commentTypeTagsList != null && message.hasOwnProperty("commentTypeTagsList")) {
        if (!Array.isArray(message.commentTypeTagsList))
          return "commentTypeTagsList: array expected";
        for (let i = 0; i < message.commentTypeTagsList.length; ++i)
          switch (message.commentTypeTagsList[i]) {
            default:
              return "commentTypeTagsList: enum value[] expected";
            case 0:
            case 1:
              break;
          }
      }
      return null;
    };

    /**
     * Creates a LandscapeAreaCommon message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.LandscapeAreaCommon
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.LandscapeAreaCommon} LandscapeAreaCommon
     */
    LandscapeAreaCommon.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.LandscapeAreaCommon) return object;
      let message = new $root.douyin.LandscapeAreaCommon();
      if (object.showHead != null) message.showHead = Boolean(object.showHead);
      if (object.showNickname != null) message.showNickname = Boolean(object.showNickname);
      if (object.showFontColor != null) message.showFontColor = Boolean(object.showFontColor);
      if (object.colorValueList) {
        if (!Array.isArray(object.colorValueList))
          throw TypeError(".douyin.LandscapeAreaCommon.colorValueList: array expected");
        message.colorValueList = [];
        for (let i = 0; i < object.colorValueList.length; ++i)
          message.colorValueList[i] = String(object.colorValueList[i]);
      }
      if (object.commentTypeTagsList) {
        if (!Array.isArray(object.commentTypeTagsList))
          throw TypeError(".douyin.LandscapeAreaCommon.commentTypeTagsList: array expected");
        message.commentTypeTagsList = [];
        for (let i = 0; i < object.commentTypeTagsList.length; ++i)
          switch (object.commentTypeTagsList[i]) {
            default:
              if (typeof object.commentTypeTagsList[i] === "number") {
                message.commentTypeTagsList[i] = object.commentTypeTagsList[i];
                break;
              }
            case "COMMENTTYPETAGUNKNOWN":
            case 0:
              message.commentTypeTagsList[i] = 0;
              break;
            case "COMMENTTYPETAGSTAR":
            case 1:
              message.commentTypeTagsList[i] = 1;
              break;
          }
      }
      return message;
    };

    /**
     * Creates a plain object from a LandscapeAreaCommon message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.LandscapeAreaCommon
     * @static
     * @param {douyin.LandscapeAreaCommon} message LandscapeAreaCommon
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    LandscapeAreaCommon.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) {
        object.colorValueList = [];
        object.commentTypeTagsList = [];
      }
      if (options.defaults) {
        object.showHead = false;
        object.showNickname = false;
        object.showFontColor = false;
      }
      if (message.showHead != null && message.hasOwnProperty("showHead"))
        object.showHead = message.showHead;
      if (message.showNickname != null && message.hasOwnProperty("showNickname"))
        object.showNickname = message.showNickname;
      if (message.showFontColor != null && message.hasOwnProperty("showFontColor"))
        object.showFontColor = message.showFontColor;
      if (message.colorValueList && message.colorValueList.length) {
        object.colorValueList = [];
        for (let j = 0; j < message.colorValueList.length; ++j)
          object.colorValueList[j] = message.colorValueList[j];
      }
      if (message.commentTypeTagsList && message.commentTypeTagsList.length) {
        object.commentTypeTagsList = [];
        for (let j = 0; j < message.commentTypeTagsList.length; ++j)
          object.commentTypeTagsList[j] =
            options.enums === String
              ? $root.douyin.CommentTypeTag[message.commentTypeTagsList[j]] === undefined
                ? message.commentTypeTagsList[j]
                : $root.douyin.CommentTypeTag[message.commentTypeTagsList[j]]
              : message.commentTypeTagsList[j];
      }
      return object;
    };

    /**
     * Converts this LandscapeAreaCommon to JSON.
     * @function toJSON
     * @memberof douyin.LandscapeAreaCommon
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    LandscapeAreaCommon.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for LandscapeAreaCommon
     * @function getTypeUrl
     * @memberof douyin.LandscapeAreaCommon
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    LandscapeAreaCommon.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.LandscapeAreaCommon";
    };

    return LandscapeAreaCommon;
  })();

  douyin.RoomUserSeqMessage = (function () {
    /**
     * Properties of a RoomUserSeqMessage.
     * @memberof douyin
     * @interface IRoomUserSeqMessage
     * @property {douyin.ICommon|null} [common] RoomUserSeqMessage common
     * @property {Array.<douyin.IRoomUserSeqMessageContributor>|null} [ranksList] RoomUserSeqMessage ranksList
     * @property {number|Long|null} [total] RoomUserSeqMessage total
     * @property {string|null} [popStr] RoomUserSeqMessage popStr
     * @property {Array.<douyin.IRoomUserSeqMessageContributor>|null} [seatsList] RoomUserSeqMessage seatsList
     * @property {number|Long|null} [popularity] RoomUserSeqMessage popularity
     * @property {number|Long|null} [totalUser] RoomUserSeqMessage totalUser
     * @property {string|null} [totalUserStr] RoomUserSeqMessage totalUserStr
     * @property {string|null} [totalStr] RoomUserSeqMessage totalStr
     * @property {string|null} [onlineUserForAnchor] RoomUserSeqMessage onlineUserForAnchor
     * @property {string|null} [totalPvForAnchor] RoomUserSeqMessage totalPvForAnchor
     * @property {string|null} [upRightStatsStr] RoomUserSeqMessage upRightStatsStr
     * @property {string|null} [upRightStatsStrComplete] RoomUserSeqMessage upRightStatsStrComplete
     */

    /**
     * Constructs a new RoomUserSeqMessage.
     * @memberof douyin
     * @classdesc Represents a RoomUserSeqMessage.
     * @implements IRoomUserSeqMessage
     * @constructor
     * @param {douyin.IRoomUserSeqMessage=} [properties] Properties to set
     */
    function RoomUserSeqMessage(properties) {
      this.ranksList = [];
      this.seatsList = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * RoomUserSeqMessage common.
     * @member {douyin.ICommon|null|undefined} common
     * @memberof douyin.RoomUserSeqMessage
     * @instance
     */
    RoomUserSeqMessage.prototype.common = null;

    /**
     * RoomUserSeqMessage ranksList.
     * @member {Array.<douyin.IRoomUserSeqMessageContributor>} ranksList
     * @memberof douyin.RoomUserSeqMessage
     * @instance
     */
    RoomUserSeqMessage.prototype.ranksList = $util.emptyArray;

    /**
     * RoomUserSeqMessage total.
     * @member {number|Long} total
     * @memberof douyin.RoomUserSeqMessage
     * @instance
     */
    RoomUserSeqMessage.prototype.total = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;

    /**
     * RoomUserSeqMessage popStr.
     * @member {string} popStr
     * @memberof douyin.RoomUserSeqMessage
     * @instance
     */
    RoomUserSeqMessage.prototype.popStr = "";

    /**
     * RoomUserSeqMessage seatsList.
     * @member {Array.<douyin.IRoomUserSeqMessageContributor>} seatsList
     * @memberof douyin.RoomUserSeqMessage
     * @instance
     */
    RoomUserSeqMessage.prototype.seatsList = $util.emptyArray;

    /**
     * RoomUserSeqMessage popularity.
     * @member {number|Long} popularity
     * @memberof douyin.RoomUserSeqMessage
     * @instance
     */
    RoomUserSeqMessage.prototype.popularity = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;

    /**
     * RoomUserSeqMessage totalUser.
     * @member {number|Long} totalUser
     * @memberof douyin.RoomUserSeqMessage
     * @instance
     */
    RoomUserSeqMessage.prototype.totalUser = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;

    /**
     * RoomUserSeqMessage totalUserStr.
     * @member {string} totalUserStr
     * @memberof douyin.RoomUserSeqMessage
     * @instance
     */
    RoomUserSeqMessage.prototype.totalUserStr = "";

    /**
     * RoomUserSeqMessage totalStr.
     * @member {string} totalStr
     * @memberof douyin.RoomUserSeqMessage
     * @instance
     */
    RoomUserSeqMessage.prototype.totalStr = "";

    /**
     * RoomUserSeqMessage onlineUserForAnchor.
     * @member {string} onlineUserForAnchor
     * @memberof douyin.RoomUserSeqMessage
     * @instance
     */
    RoomUserSeqMessage.prototype.onlineUserForAnchor = "";

    /**
     * RoomUserSeqMessage totalPvForAnchor.
     * @member {string} totalPvForAnchor
     * @memberof douyin.RoomUserSeqMessage
     * @instance
     */
    RoomUserSeqMessage.prototype.totalPvForAnchor = "";

    /**
     * RoomUserSeqMessage upRightStatsStr.
     * @member {string} upRightStatsStr
     * @memberof douyin.RoomUserSeqMessage
     * @instance
     */
    RoomUserSeqMessage.prototype.upRightStatsStr = "";

    /**
     * RoomUserSeqMessage upRightStatsStrComplete.
     * @member {string} upRightStatsStrComplete
     * @memberof douyin.RoomUserSeqMessage
     * @instance
     */
    RoomUserSeqMessage.prototype.upRightStatsStrComplete = "";

    /**
     * Creates a new RoomUserSeqMessage instance using the specified properties.
     * @function create
     * @memberof douyin.RoomUserSeqMessage
     * @static
     * @param {douyin.IRoomUserSeqMessage=} [properties] Properties to set
     * @returns {douyin.RoomUserSeqMessage} RoomUserSeqMessage instance
     */
    RoomUserSeqMessage.create = function create(properties) {
      return new RoomUserSeqMessage(properties);
    };

    /**
     * Encodes the specified RoomUserSeqMessage message. Does not implicitly {@link douyin.RoomUserSeqMessage.verify|verify} messages.
     * @function encode
     * @memberof douyin.RoomUserSeqMessage
     * @static
     * @param {douyin.IRoomUserSeqMessage} message RoomUserSeqMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    RoomUserSeqMessage.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.common != null && Object.hasOwnProperty.call(message, "common"))
        $root.douyin.Common.encode(
          message.common,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (message.ranksList != null && message.ranksList.length)
        for (let i = 0; i < message.ranksList.length; ++i)
          $root.douyin.RoomUserSeqMessageContributor.encode(
            message.ranksList[i],
            writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
          ).ldelim();
      if (message.total != null && Object.hasOwnProperty.call(message, "total"))
        writer.uint32(/* id 3, wireType 0 =*/ 24).int64(message.total);
      if (message.popStr != null && Object.hasOwnProperty.call(message, "popStr"))
        writer.uint32(/* id 4, wireType 2 =*/ 34).string(message.popStr);
      if (message.seatsList != null && message.seatsList.length)
        for (let i = 0; i < message.seatsList.length; ++i)
          $root.douyin.RoomUserSeqMessageContributor.encode(
            message.seatsList[i],
            writer.uint32(/* id 5, wireType 2 =*/ 42).fork(),
          ).ldelim();
      if (message.popularity != null && Object.hasOwnProperty.call(message, "popularity"))
        writer.uint32(/* id 6, wireType 0 =*/ 48).int64(message.popularity);
      if (message.totalUser != null && Object.hasOwnProperty.call(message, "totalUser"))
        writer.uint32(/* id 7, wireType 0 =*/ 56).int64(message.totalUser);
      if (message.totalUserStr != null && Object.hasOwnProperty.call(message, "totalUserStr"))
        writer.uint32(/* id 8, wireType 2 =*/ 66).string(message.totalUserStr);
      if (message.totalStr != null && Object.hasOwnProperty.call(message, "totalStr"))
        writer.uint32(/* id 9, wireType 2 =*/ 74).string(message.totalStr);
      if (
        message.onlineUserForAnchor != null &&
        Object.hasOwnProperty.call(message, "onlineUserForAnchor")
      )
        writer.uint32(/* id 10, wireType 2 =*/ 82).string(message.onlineUserForAnchor);
      if (
        message.totalPvForAnchor != null &&
        Object.hasOwnProperty.call(message, "totalPvForAnchor")
      )
        writer.uint32(/* id 11, wireType 2 =*/ 90).string(message.totalPvForAnchor);
      if (message.upRightStatsStr != null && Object.hasOwnProperty.call(message, "upRightStatsStr"))
        writer.uint32(/* id 12, wireType 2 =*/ 98).string(message.upRightStatsStr);
      if (
        message.upRightStatsStrComplete != null &&
        Object.hasOwnProperty.call(message, "upRightStatsStrComplete")
      )
        writer.uint32(/* id 13, wireType 2 =*/ 106).string(message.upRightStatsStrComplete);
      return writer;
    };

    /**
     * Encodes the specified RoomUserSeqMessage message, length delimited. Does not implicitly {@link douyin.RoomUserSeqMessage.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.RoomUserSeqMessage
     * @static
     * @param {douyin.IRoomUserSeqMessage} message RoomUserSeqMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    RoomUserSeqMessage.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a RoomUserSeqMessage message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.RoomUserSeqMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.RoomUserSeqMessage} RoomUserSeqMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    RoomUserSeqMessage.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.RoomUserSeqMessage();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.common = $root.douyin.Common.decode(reader, reader.uint32());
            break;
          }
          case 2: {
            if (!(message.ranksList && message.ranksList.length)) message.ranksList = [];
            message.ranksList.push(
              $root.douyin.RoomUserSeqMessageContributor.decode(reader, reader.uint32()),
            );
            break;
          }
          case 3: {
            message.total = reader.int64();
            break;
          }
          case 4: {
            message.popStr = reader.string();
            break;
          }
          case 5: {
            if (!(message.seatsList && message.seatsList.length)) message.seatsList = [];
            message.seatsList.push(
              $root.douyin.RoomUserSeqMessageContributor.decode(reader, reader.uint32()),
            );
            break;
          }
          case 6: {
            message.popularity = reader.int64();
            break;
          }
          case 7: {
            message.totalUser = reader.int64();
            break;
          }
          case 8: {
            message.totalUserStr = reader.string();
            break;
          }
          case 9: {
            message.totalStr = reader.string();
            break;
          }
          case 10: {
            message.onlineUserForAnchor = reader.string();
            break;
          }
          case 11: {
            message.totalPvForAnchor = reader.string();
            break;
          }
          case 12: {
            message.upRightStatsStr = reader.string();
            break;
          }
          case 13: {
            message.upRightStatsStrComplete = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a RoomUserSeqMessage message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.RoomUserSeqMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.RoomUserSeqMessage} RoomUserSeqMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    RoomUserSeqMessage.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a RoomUserSeqMessage message.
     * @function verify
     * @memberof douyin.RoomUserSeqMessage
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    RoomUserSeqMessage.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.common != null && message.hasOwnProperty("common")) {
        let error = $root.douyin.Common.verify(message.common);
        if (error) return "common." + error;
      }
      if (message.ranksList != null && message.hasOwnProperty("ranksList")) {
        if (!Array.isArray(message.ranksList)) return "ranksList: array expected";
        for (let i = 0; i < message.ranksList.length; ++i) {
          let error = $root.douyin.RoomUserSeqMessageContributor.verify(message.ranksList[i]);
          if (error) return "ranksList." + error;
        }
      }
      if (message.total != null && message.hasOwnProperty("total"))
        if (
          !$util.isInteger(message.total) &&
          !(
            message.total &&
            $util.isInteger(message.total.low) &&
            $util.isInteger(message.total.high)
          )
        )
          return "total: integer|Long expected";
      if (message.popStr != null && message.hasOwnProperty("popStr"))
        if (!$util.isString(message.popStr)) return "popStr: string expected";
      if (message.seatsList != null && message.hasOwnProperty("seatsList")) {
        if (!Array.isArray(message.seatsList)) return "seatsList: array expected";
        for (let i = 0; i < message.seatsList.length; ++i) {
          let error = $root.douyin.RoomUserSeqMessageContributor.verify(message.seatsList[i]);
          if (error) return "seatsList." + error;
        }
      }
      if (message.popularity != null && message.hasOwnProperty("popularity"))
        if (
          !$util.isInteger(message.popularity) &&
          !(
            message.popularity &&
            $util.isInteger(message.popularity.low) &&
            $util.isInteger(message.popularity.high)
          )
        )
          return "popularity: integer|Long expected";
      if (message.totalUser != null && message.hasOwnProperty("totalUser"))
        if (
          !$util.isInteger(message.totalUser) &&
          !(
            message.totalUser &&
            $util.isInteger(message.totalUser.low) &&
            $util.isInteger(message.totalUser.high)
          )
        )
          return "totalUser: integer|Long expected";
      if (message.totalUserStr != null && message.hasOwnProperty("totalUserStr"))
        if (!$util.isString(message.totalUserStr)) return "totalUserStr: string expected";
      if (message.totalStr != null && message.hasOwnProperty("totalStr"))
        if (!$util.isString(message.totalStr)) return "totalStr: string expected";
      if (message.onlineUserForAnchor != null && message.hasOwnProperty("onlineUserForAnchor"))
        if (!$util.isString(message.onlineUserForAnchor))
          return "onlineUserForAnchor: string expected";
      if (message.totalPvForAnchor != null && message.hasOwnProperty("totalPvForAnchor"))
        if (!$util.isString(message.totalPvForAnchor)) return "totalPvForAnchor: string expected";
      if (message.upRightStatsStr != null && message.hasOwnProperty("upRightStatsStr"))
        if (!$util.isString(message.upRightStatsStr)) return "upRightStatsStr: string expected";
      if (
        message.upRightStatsStrComplete != null &&
        message.hasOwnProperty("upRightStatsStrComplete")
      )
        if (!$util.isString(message.upRightStatsStrComplete))
          return "upRightStatsStrComplete: string expected";
      return null;
    };

    /**
     * Creates a RoomUserSeqMessage message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.RoomUserSeqMessage
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.RoomUserSeqMessage} RoomUserSeqMessage
     */
    RoomUserSeqMessage.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.RoomUserSeqMessage) return object;
      let message = new $root.douyin.RoomUserSeqMessage();
      if (object.common != null) {
        if (typeof object.common !== "object")
          throw TypeError(".douyin.RoomUserSeqMessage.common: object expected");
        message.common = $root.douyin.Common.fromObject(object.common);
      }
      if (object.ranksList) {
        if (!Array.isArray(object.ranksList))
          throw TypeError(".douyin.RoomUserSeqMessage.ranksList: array expected");
        message.ranksList = [];
        for (let i = 0; i < object.ranksList.length; ++i) {
          if (typeof object.ranksList[i] !== "object")
            throw TypeError(".douyin.RoomUserSeqMessage.ranksList: object expected");
          message.ranksList[i] = $root.douyin.RoomUserSeqMessageContributor.fromObject(
            object.ranksList[i],
          );
        }
      }
      if (object.total != null)
        if ($util.Long) (message.total = $util.Long.fromValue(object.total)).unsigned = false;
        else if (typeof object.total === "string") message.total = parseInt(object.total, 10);
        else if (typeof object.total === "number") message.total = object.total;
        else if (typeof object.total === "object")
          message.total = new $util.LongBits(
            object.total.low >>> 0,
            object.total.high >>> 0,
          ).toNumber();
      if (object.popStr != null) message.popStr = String(object.popStr);
      if (object.seatsList) {
        if (!Array.isArray(object.seatsList))
          throw TypeError(".douyin.RoomUserSeqMessage.seatsList: array expected");
        message.seatsList = [];
        for (let i = 0; i < object.seatsList.length; ++i) {
          if (typeof object.seatsList[i] !== "object")
            throw TypeError(".douyin.RoomUserSeqMessage.seatsList: object expected");
          message.seatsList[i] = $root.douyin.RoomUserSeqMessageContributor.fromObject(
            object.seatsList[i],
          );
        }
      }
      if (object.popularity != null)
        if ($util.Long)
          (message.popularity = $util.Long.fromValue(object.popularity)).unsigned = false;
        else if (typeof object.popularity === "string")
          message.popularity = parseInt(object.popularity, 10);
        else if (typeof object.popularity === "number") message.popularity = object.popularity;
        else if (typeof object.popularity === "object")
          message.popularity = new $util.LongBits(
            object.popularity.low >>> 0,
            object.popularity.high >>> 0,
          ).toNumber();
      if (object.totalUser != null)
        if ($util.Long)
          (message.totalUser = $util.Long.fromValue(object.totalUser)).unsigned = false;
        else if (typeof object.totalUser === "string")
          message.totalUser = parseInt(object.totalUser, 10);
        else if (typeof object.totalUser === "number") message.totalUser = object.totalUser;
        else if (typeof object.totalUser === "object")
          message.totalUser = new $util.LongBits(
            object.totalUser.low >>> 0,
            object.totalUser.high >>> 0,
          ).toNumber();
      if (object.totalUserStr != null) message.totalUserStr = String(object.totalUserStr);
      if (object.totalStr != null) message.totalStr = String(object.totalStr);
      if (object.onlineUserForAnchor != null)
        message.onlineUserForAnchor = String(object.onlineUserForAnchor);
      if (object.totalPvForAnchor != null)
        message.totalPvForAnchor = String(object.totalPvForAnchor);
      if (object.upRightStatsStr != null) message.upRightStatsStr = String(object.upRightStatsStr);
      if (object.upRightStatsStrComplete != null)
        message.upRightStatsStrComplete = String(object.upRightStatsStrComplete);
      return message;
    };

    /**
     * Creates a plain object from a RoomUserSeqMessage message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.RoomUserSeqMessage
     * @static
     * @param {douyin.RoomUserSeqMessage} message RoomUserSeqMessage
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    RoomUserSeqMessage.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) {
        object.ranksList = [];
        object.seatsList = [];
      }
      if (options.defaults) {
        object.common = null;
        if ($util.Long) {
          let long = new $util.Long(0, 0, false);
          object.total =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.total = options.longs === String ? "0" : 0;
        object.popStr = "";
        if ($util.Long) {
          let long = new $util.Long(0, 0, false);
          object.popularity =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.popularity = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, false);
          object.totalUser =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.totalUser = options.longs === String ? "0" : 0;
        object.totalUserStr = "";
        object.totalStr = "";
        object.onlineUserForAnchor = "";
        object.totalPvForAnchor = "";
        object.upRightStatsStr = "";
        object.upRightStatsStrComplete = "";
      }
      if (message.common != null && message.hasOwnProperty("common"))
        object.common = $root.douyin.Common.toObject(message.common, options);
      if (message.ranksList && message.ranksList.length) {
        object.ranksList = [];
        for (let j = 0; j < message.ranksList.length; ++j)
          object.ranksList[j] = $root.douyin.RoomUserSeqMessageContributor.toObject(
            message.ranksList[j],
            options,
          );
      }
      if (message.total != null && message.hasOwnProperty("total"))
        if (typeof message.total === "number")
          object.total = options.longs === String ? String(message.total) : message.total;
        else
          object.total =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.total)
              : options.longs === Number
                ? new $util.LongBits(message.total.low >>> 0, message.total.high >>> 0).toNumber()
                : message.total;
      if (message.popStr != null && message.hasOwnProperty("popStr"))
        object.popStr = message.popStr;
      if (message.seatsList && message.seatsList.length) {
        object.seatsList = [];
        for (let j = 0; j < message.seatsList.length; ++j)
          object.seatsList[j] = $root.douyin.RoomUserSeqMessageContributor.toObject(
            message.seatsList[j],
            options,
          );
      }
      if (message.popularity != null && message.hasOwnProperty("popularity"))
        if (typeof message.popularity === "number")
          object.popularity =
            options.longs === String ? String(message.popularity) : message.popularity;
        else
          object.popularity =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.popularity)
              : options.longs === Number
                ? new $util.LongBits(
                    message.popularity.low >>> 0,
                    message.popularity.high >>> 0,
                  ).toNumber()
                : message.popularity;
      if (message.totalUser != null && message.hasOwnProperty("totalUser"))
        if (typeof message.totalUser === "number")
          object.totalUser =
            options.longs === String ? String(message.totalUser) : message.totalUser;
        else
          object.totalUser =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.totalUser)
              : options.longs === Number
                ? new $util.LongBits(
                    message.totalUser.low >>> 0,
                    message.totalUser.high >>> 0,
                  ).toNumber()
                : message.totalUser;
      if (message.totalUserStr != null && message.hasOwnProperty("totalUserStr"))
        object.totalUserStr = message.totalUserStr;
      if (message.totalStr != null && message.hasOwnProperty("totalStr"))
        object.totalStr = message.totalStr;
      if (message.onlineUserForAnchor != null && message.hasOwnProperty("onlineUserForAnchor"))
        object.onlineUserForAnchor = message.onlineUserForAnchor;
      if (message.totalPvForAnchor != null && message.hasOwnProperty("totalPvForAnchor"))
        object.totalPvForAnchor = message.totalPvForAnchor;
      if (message.upRightStatsStr != null && message.hasOwnProperty("upRightStatsStr"))
        object.upRightStatsStr = message.upRightStatsStr;
      if (
        message.upRightStatsStrComplete != null &&
        message.hasOwnProperty("upRightStatsStrComplete")
      )
        object.upRightStatsStrComplete = message.upRightStatsStrComplete;
      return object;
    };

    /**
     * Converts this RoomUserSeqMessage to JSON.
     * @function toJSON
     * @memberof douyin.RoomUserSeqMessage
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    RoomUserSeqMessage.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for RoomUserSeqMessage
     * @function getTypeUrl
     * @memberof douyin.RoomUserSeqMessage
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    RoomUserSeqMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.RoomUserSeqMessage";
    };

    return RoomUserSeqMessage;
  })();

  douyin.CommonTextMessage = (function () {
    /**
     * Properties of a CommonTextMessage.
     * @memberof douyin
     * @interface ICommonTextMessage
     * @property {douyin.ICommon|null} [common] CommonTextMessage common
     * @property {douyin.IUser|null} [user] CommonTextMessage user
     * @property {string|null} [scene] CommonTextMessage scene
     */

    /**
     * Constructs a new CommonTextMessage.
     * @memberof douyin
     * @classdesc Represents a CommonTextMessage.
     * @implements ICommonTextMessage
     * @constructor
     * @param {douyin.ICommonTextMessage=} [properties] Properties to set
     */
    function CommonTextMessage(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * CommonTextMessage common.
     * @member {douyin.ICommon|null|undefined} common
     * @memberof douyin.CommonTextMessage
     * @instance
     */
    CommonTextMessage.prototype.common = null;

    /**
     * CommonTextMessage user.
     * @member {douyin.IUser|null|undefined} user
     * @memberof douyin.CommonTextMessage
     * @instance
     */
    CommonTextMessage.prototype.user = null;

    /**
     * CommonTextMessage scene.
     * @member {string} scene
     * @memberof douyin.CommonTextMessage
     * @instance
     */
    CommonTextMessage.prototype.scene = "";

    /**
     * Creates a new CommonTextMessage instance using the specified properties.
     * @function create
     * @memberof douyin.CommonTextMessage
     * @static
     * @param {douyin.ICommonTextMessage=} [properties] Properties to set
     * @returns {douyin.CommonTextMessage} CommonTextMessage instance
     */
    CommonTextMessage.create = function create(properties) {
      return new CommonTextMessage(properties);
    };

    /**
     * Encodes the specified CommonTextMessage message. Does not implicitly {@link douyin.CommonTextMessage.verify|verify} messages.
     * @function encode
     * @memberof douyin.CommonTextMessage
     * @static
     * @param {douyin.ICommonTextMessage} message CommonTextMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CommonTextMessage.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.common != null && Object.hasOwnProperty.call(message, "common"))
        $root.douyin.Common.encode(
          message.common,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (message.user != null && Object.hasOwnProperty.call(message, "user"))
        $root.douyin.User.encode(
          message.user,
          writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
        ).ldelim();
      if (message.scene != null && Object.hasOwnProperty.call(message, "scene"))
        writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.scene);
      return writer;
    };

    /**
     * Encodes the specified CommonTextMessage message, length delimited. Does not implicitly {@link douyin.CommonTextMessage.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.CommonTextMessage
     * @static
     * @param {douyin.ICommonTextMessage} message CommonTextMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CommonTextMessage.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CommonTextMessage message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.CommonTextMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.CommonTextMessage} CommonTextMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CommonTextMessage.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.CommonTextMessage();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.common = $root.douyin.Common.decode(reader, reader.uint32());
            break;
          }
          case 2: {
            message.user = $root.douyin.User.decode(reader, reader.uint32());
            break;
          }
          case 3: {
            message.scene = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a CommonTextMessage message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.CommonTextMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.CommonTextMessage} CommonTextMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CommonTextMessage.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CommonTextMessage message.
     * @function verify
     * @memberof douyin.CommonTextMessage
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CommonTextMessage.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.common != null && message.hasOwnProperty("common")) {
        let error = $root.douyin.Common.verify(message.common);
        if (error) return "common." + error;
      }
      if (message.user != null && message.hasOwnProperty("user")) {
        let error = $root.douyin.User.verify(message.user);
        if (error) return "user." + error;
      }
      if (message.scene != null && message.hasOwnProperty("scene"))
        if (!$util.isString(message.scene)) return "scene: string expected";
      return null;
    };

    /**
     * Creates a CommonTextMessage message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.CommonTextMessage
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.CommonTextMessage} CommonTextMessage
     */
    CommonTextMessage.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.CommonTextMessage) return object;
      let message = new $root.douyin.CommonTextMessage();
      if (object.common != null) {
        if (typeof object.common !== "object")
          throw TypeError(".douyin.CommonTextMessage.common: object expected");
        message.common = $root.douyin.Common.fromObject(object.common);
      }
      if (object.user != null) {
        if (typeof object.user !== "object")
          throw TypeError(".douyin.CommonTextMessage.user: object expected");
        message.user = $root.douyin.User.fromObject(object.user);
      }
      if (object.scene != null) message.scene = String(object.scene);
      return message;
    };

    /**
     * Creates a plain object from a CommonTextMessage message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.CommonTextMessage
     * @static
     * @param {douyin.CommonTextMessage} message CommonTextMessage
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CommonTextMessage.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.common = null;
        object.user = null;
        object.scene = "";
      }
      if (message.common != null && message.hasOwnProperty("common"))
        object.common = $root.douyin.Common.toObject(message.common, options);
      if (message.user != null && message.hasOwnProperty("user"))
        object.user = $root.douyin.User.toObject(message.user, options);
      if (message.scene != null && message.hasOwnProperty("scene")) object.scene = message.scene;
      return object;
    };

    /**
     * Converts this CommonTextMessage to JSON.
     * @function toJSON
     * @memberof douyin.CommonTextMessage
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CommonTextMessage.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CommonTextMessage
     * @function getTypeUrl
     * @memberof douyin.CommonTextMessage
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CommonTextMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.CommonTextMessage";
    };

    return CommonTextMessage;
  })();

  douyin.UpdateFanTicketMessage = (function () {
    /**
     * Properties of an UpdateFanTicketMessage.
     * @memberof douyin
     * @interface IUpdateFanTicketMessage
     * @property {douyin.ICommon|null} [common] UpdateFanTicketMessage common
     * @property {string|null} [roomFanTicketCountText] UpdateFanTicketMessage roomFanTicketCountText
     * @property {number|Long|null} [roomFanTicketCount] UpdateFanTicketMessage roomFanTicketCount
     * @property {boolean|null} [forceUpdate] UpdateFanTicketMessage forceUpdate
     */

    /**
     * Constructs a new UpdateFanTicketMessage.
     * @memberof douyin
     * @classdesc Represents an UpdateFanTicketMessage.
     * @implements IUpdateFanTicketMessage
     * @constructor
     * @param {douyin.IUpdateFanTicketMessage=} [properties] Properties to set
     */
    function UpdateFanTicketMessage(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * UpdateFanTicketMessage common.
     * @member {douyin.ICommon|null|undefined} common
     * @memberof douyin.UpdateFanTicketMessage
     * @instance
     */
    UpdateFanTicketMessage.prototype.common = null;

    /**
     * UpdateFanTicketMessage roomFanTicketCountText.
     * @member {string} roomFanTicketCountText
     * @memberof douyin.UpdateFanTicketMessage
     * @instance
     */
    UpdateFanTicketMessage.prototype.roomFanTicketCountText = "";

    /**
     * UpdateFanTicketMessage roomFanTicketCount.
     * @member {number|Long} roomFanTicketCount
     * @memberof douyin.UpdateFanTicketMessage
     * @instance
     */
    UpdateFanTicketMessage.prototype.roomFanTicketCount = $util.Long
      ? $util.Long.fromBits(0, 0, true)
      : 0;

    /**
     * UpdateFanTicketMessage forceUpdate.
     * @member {boolean} forceUpdate
     * @memberof douyin.UpdateFanTicketMessage
     * @instance
     */
    UpdateFanTicketMessage.prototype.forceUpdate = false;

    /**
     * Creates a new UpdateFanTicketMessage instance using the specified properties.
     * @function create
     * @memberof douyin.UpdateFanTicketMessage
     * @static
     * @param {douyin.IUpdateFanTicketMessage=} [properties] Properties to set
     * @returns {douyin.UpdateFanTicketMessage} UpdateFanTicketMessage instance
     */
    UpdateFanTicketMessage.create = function create(properties) {
      return new UpdateFanTicketMessage(properties);
    };

    /**
     * Encodes the specified UpdateFanTicketMessage message. Does not implicitly {@link douyin.UpdateFanTicketMessage.verify|verify} messages.
     * @function encode
     * @memberof douyin.UpdateFanTicketMessage
     * @static
     * @param {douyin.IUpdateFanTicketMessage} message UpdateFanTicketMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    UpdateFanTicketMessage.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.common != null && Object.hasOwnProperty.call(message, "common"))
        $root.douyin.Common.encode(
          message.common,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (
        message.roomFanTicketCountText != null &&
        Object.hasOwnProperty.call(message, "roomFanTicketCountText")
      )
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.roomFanTicketCountText);
      if (
        message.roomFanTicketCount != null &&
        Object.hasOwnProperty.call(message, "roomFanTicketCount")
      )
        writer.uint32(/* id 3, wireType 0 =*/ 24).uint64(message.roomFanTicketCount);
      if (message.forceUpdate != null && Object.hasOwnProperty.call(message, "forceUpdate"))
        writer.uint32(/* id 4, wireType 0 =*/ 32).bool(message.forceUpdate);
      return writer;
    };

    /**
     * Encodes the specified UpdateFanTicketMessage message, length delimited. Does not implicitly {@link douyin.UpdateFanTicketMessage.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.UpdateFanTicketMessage
     * @static
     * @param {douyin.IUpdateFanTicketMessage} message UpdateFanTicketMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    UpdateFanTicketMessage.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes an UpdateFanTicketMessage message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.UpdateFanTicketMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.UpdateFanTicketMessage} UpdateFanTicketMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    UpdateFanTicketMessage.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.UpdateFanTicketMessage();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.common = $root.douyin.Common.decode(reader, reader.uint32());
            break;
          }
          case 2: {
            message.roomFanTicketCountText = reader.string();
            break;
          }
          case 3: {
            message.roomFanTicketCount = reader.uint64();
            break;
          }
          case 4: {
            message.forceUpdate = reader.bool();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes an UpdateFanTicketMessage message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.UpdateFanTicketMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.UpdateFanTicketMessage} UpdateFanTicketMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    UpdateFanTicketMessage.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies an UpdateFanTicketMessage message.
     * @function verify
     * @memberof douyin.UpdateFanTicketMessage
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    UpdateFanTicketMessage.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.common != null && message.hasOwnProperty("common")) {
        let error = $root.douyin.Common.verify(message.common);
        if (error) return "common." + error;
      }
      if (
        message.roomFanTicketCountText != null &&
        message.hasOwnProperty("roomFanTicketCountText")
      )
        if (!$util.isString(message.roomFanTicketCountText))
          return "roomFanTicketCountText: string expected";
      if (message.roomFanTicketCount != null && message.hasOwnProperty("roomFanTicketCount"))
        if (
          !$util.isInteger(message.roomFanTicketCount) &&
          !(
            message.roomFanTicketCount &&
            $util.isInteger(message.roomFanTicketCount.low) &&
            $util.isInteger(message.roomFanTicketCount.high)
          )
        )
          return "roomFanTicketCount: integer|Long expected";
      if (message.forceUpdate != null && message.hasOwnProperty("forceUpdate"))
        if (typeof message.forceUpdate !== "boolean") return "forceUpdate: boolean expected";
      return null;
    };

    /**
     * Creates an UpdateFanTicketMessage message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.UpdateFanTicketMessage
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.UpdateFanTicketMessage} UpdateFanTicketMessage
     */
    UpdateFanTicketMessage.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.UpdateFanTicketMessage) return object;
      let message = new $root.douyin.UpdateFanTicketMessage();
      if (object.common != null) {
        if (typeof object.common !== "object")
          throw TypeError(".douyin.UpdateFanTicketMessage.common: object expected");
        message.common = $root.douyin.Common.fromObject(object.common);
      }
      if (object.roomFanTicketCountText != null)
        message.roomFanTicketCountText = String(object.roomFanTicketCountText);
      if (object.roomFanTicketCount != null)
        if ($util.Long)
          (message.roomFanTicketCount = $util.Long.fromValue(object.roomFanTicketCount)).unsigned =
            true;
        else if (typeof object.roomFanTicketCount === "string")
          message.roomFanTicketCount = parseInt(object.roomFanTicketCount, 10);
        else if (typeof object.roomFanTicketCount === "number")
          message.roomFanTicketCount = object.roomFanTicketCount;
        else if (typeof object.roomFanTicketCount === "object")
          message.roomFanTicketCount = new $util.LongBits(
            object.roomFanTicketCount.low >>> 0,
            object.roomFanTicketCount.high >>> 0,
          ).toNumber(true);
      if (object.forceUpdate != null) message.forceUpdate = Boolean(object.forceUpdate);
      return message;
    };

    /**
     * Creates a plain object from an UpdateFanTicketMessage message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.UpdateFanTicketMessage
     * @static
     * @param {douyin.UpdateFanTicketMessage} message UpdateFanTicketMessage
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    UpdateFanTicketMessage.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.common = null;
        object.roomFanTicketCountText = "";
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.roomFanTicketCount =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.roomFanTicketCount = options.longs === String ? "0" : 0;
        object.forceUpdate = false;
      }
      if (message.common != null && message.hasOwnProperty("common"))
        object.common = $root.douyin.Common.toObject(message.common, options);
      if (
        message.roomFanTicketCountText != null &&
        message.hasOwnProperty("roomFanTicketCountText")
      )
        object.roomFanTicketCountText = message.roomFanTicketCountText;
      if (message.roomFanTicketCount != null && message.hasOwnProperty("roomFanTicketCount"))
        if (typeof message.roomFanTicketCount === "number")
          object.roomFanTicketCount =
            options.longs === String
              ? String(message.roomFanTicketCount)
              : message.roomFanTicketCount;
        else
          object.roomFanTicketCount =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.roomFanTicketCount)
              : options.longs === Number
                ? new $util.LongBits(
                    message.roomFanTicketCount.low >>> 0,
                    message.roomFanTicketCount.high >>> 0,
                  ).toNumber(true)
                : message.roomFanTicketCount;
      if (message.forceUpdate != null && message.hasOwnProperty("forceUpdate"))
        object.forceUpdate = message.forceUpdate;
      return object;
    };

    /**
     * Converts this UpdateFanTicketMessage to JSON.
     * @function toJSON
     * @memberof douyin.UpdateFanTicketMessage
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    UpdateFanTicketMessage.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for UpdateFanTicketMessage
     * @function getTypeUrl
     * @memberof douyin.UpdateFanTicketMessage
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    UpdateFanTicketMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.UpdateFanTicketMessage";
    };

    return UpdateFanTicketMessage;
  })();

  douyin.RoomUserSeqMessageContributor = (function () {
    /**
     * Properties of a RoomUserSeqMessageContributor.
     * @memberof douyin
     * @interface IRoomUserSeqMessageContributor
     * @property {number|Long|null} [score] RoomUserSeqMessageContributor score
     * @property {douyin.IUser|null} [user] RoomUserSeqMessageContributor user
     * @property {number|Long|null} [rank] RoomUserSeqMessageContributor rank
     * @property {number|Long|null} [delta] RoomUserSeqMessageContributor delta
     * @property {boolean|null} [isHidden] RoomUserSeqMessageContributor isHidden
     * @property {string|null} [scoreDescription] RoomUserSeqMessageContributor scoreDescription
     * @property {string|null} [exactlyScore] RoomUserSeqMessageContributor exactlyScore
     */

    /**
     * Constructs a new RoomUserSeqMessageContributor.
     * @memberof douyin
     * @classdesc Represents a RoomUserSeqMessageContributor.
     * @implements IRoomUserSeqMessageContributor
     * @constructor
     * @param {douyin.IRoomUserSeqMessageContributor=} [properties] Properties to set
     */
    function RoomUserSeqMessageContributor(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * RoomUserSeqMessageContributor score.
     * @member {number|Long} score
     * @memberof douyin.RoomUserSeqMessageContributor
     * @instance
     */
    RoomUserSeqMessageContributor.prototype.score = $util.Long
      ? $util.Long.fromBits(0, 0, true)
      : 0;

    /**
     * RoomUserSeqMessageContributor user.
     * @member {douyin.IUser|null|undefined} user
     * @memberof douyin.RoomUserSeqMessageContributor
     * @instance
     */
    RoomUserSeqMessageContributor.prototype.user = null;

    /**
     * RoomUserSeqMessageContributor rank.
     * @member {number|Long} rank
     * @memberof douyin.RoomUserSeqMessageContributor
     * @instance
     */
    RoomUserSeqMessageContributor.prototype.rank = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * RoomUserSeqMessageContributor delta.
     * @member {number|Long} delta
     * @memberof douyin.RoomUserSeqMessageContributor
     * @instance
     */
    RoomUserSeqMessageContributor.prototype.delta = $util.Long
      ? $util.Long.fromBits(0, 0, true)
      : 0;

    /**
     * RoomUserSeqMessageContributor isHidden.
     * @member {boolean} isHidden
     * @memberof douyin.RoomUserSeqMessageContributor
     * @instance
     */
    RoomUserSeqMessageContributor.prototype.isHidden = false;

    /**
     * RoomUserSeqMessageContributor scoreDescription.
     * @member {string} scoreDescription
     * @memberof douyin.RoomUserSeqMessageContributor
     * @instance
     */
    RoomUserSeqMessageContributor.prototype.scoreDescription = "";

    /**
     * RoomUserSeqMessageContributor exactlyScore.
     * @member {string} exactlyScore
     * @memberof douyin.RoomUserSeqMessageContributor
     * @instance
     */
    RoomUserSeqMessageContributor.prototype.exactlyScore = "";

    /**
     * Creates a new RoomUserSeqMessageContributor instance using the specified properties.
     * @function create
     * @memberof douyin.RoomUserSeqMessageContributor
     * @static
     * @param {douyin.IRoomUserSeqMessageContributor=} [properties] Properties to set
     * @returns {douyin.RoomUserSeqMessageContributor} RoomUserSeqMessageContributor instance
     */
    RoomUserSeqMessageContributor.create = function create(properties) {
      return new RoomUserSeqMessageContributor(properties);
    };

    /**
     * Encodes the specified RoomUserSeqMessageContributor message. Does not implicitly {@link douyin.RoomUserSeqMessageContributor.verify|verify} messages.
     * @function encode
     * @memberof douyin.RoomUserSeqMessageContributor
     * @static
     * @param {douyin.IRoomUserSeqMessageContributor} message RoomUserSeqMessageContributor message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    RoomUserSeqMessageContributor.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.score != null && Object.hasOwnProperty.call(message, "score"))
        writer.uint32(/* id 1, wireType 0 =*/ 8).uint64(message.score);
      if (message.user != null && Object.hasOwnProperty.call(message, "user"))
        $root.douyin.User.encode(
          message.user,
          writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
        ).ldelim();
      if (message.rank != null && Object.hasOwnProperty.call(message, "rank"))
        writer.uint32(/* id 3, wireType 0 =*/ 24).uint64(message.rank);
      if (message.delta != null && Object.hasOwnProperty.call(message, "delta"))
        writer.uint32(/* id 4, wireType 0 =*/ 32).uint64(message.delta);
      if (message.isHidden != null && Object.hasOwnProperty.call(message, "isHidden"))
        writer.uint32(/* id 5, wireType 0 =*/ 40).bool(message.isHidden);
      if (
        message.scoreDescription != null &&
        Object.hasOwnProperty.call(message, "scoreDescription")
      )
        writer.uint32(/* id 6, wireType 2 =*/ 50).string(message.scoreDescription);
      if (message.exactlyScore != null && Object.hasOwnProperty.call(message, "exactlyScore"))
        writer.uint32(/* id 7, wireType 2 =*/ 58).string(message.exactlyScore);
      return writer;
    };

    /**
     * Encodes the specified RoomUserSeqMessageContributor message, length delimited. Does not implicitly {@link douyin.RoomUserSeqMessageContributor.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.RoomUserSeqMessageContributor
     * @static
     * @param {douyin.IRoomUserSeqMessageContributor} message RoomUserSeqMessageContributor message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    RoomUserSeqMessageContributor.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a RoomUserSeqMessageContributor message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.RoomUserSeqMessageContributor
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.RoomUserSeqMessageContributor} RoomUserSeqMessageContributor
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    RoomUserSeqMessageContributor.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.RoomUserSeqMessageContributor();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.score = reader.uint64();
            break;
          }
          case 2: {
            message.user = $root.douyin.User.decode(reader, reader.uint32());
            break;
          }
          case 3: {
            message.rank = reader.uint64();
            break;
          }
          case 4: {
            message.delta = reader.uint64();
            break;
          }
          case 5: {
            message.isHidden = reader.bool();
            break;
          }
          case 6: {
            message.scoreDescription = reader.string();
            break;
          }
          case 7: {
            message.exactlyScore = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a RoomUserSeqMessageContributor message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.RoomUserSeqMessageContributor
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.RoomUserSeqMessageContributor} RoomUserSeqMessageContributor
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    RoomUserSeqMessageContributor.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a RoomUserSeqMessageContributor message.
     * @function verify
     * @memberof douyin.RoomUserSeqMessageContributor
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    RoomUserSeqMessageContributor.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.score != null && message.hasOwnProperty("score"))
        if (
          !$util.isInteger(message.score) &&
          !(
            message.score &&
            $util.isInteger(message.score.low) &&
            $util.isInteger(message.score.high)
          )
        )
          return "score: integer|Long expected";
      if (message.user != null && message.hasOwnProperty("user")) {
        let error = $root.douyin.User.verify(message.user);
        if (error) return "user." + error;
      }
      if (message.rank != null && message.hasOwnProperty("rank"))
        if (
          !$util.isInteger(message.rank) &&
          !(message.rank && $util.isInteger(message.rank.low) && $util.isInteger(message.rank.high))
        )
          return "rank: integer|Long expected";
      if (message.delta != null && message.hasOwnProperty("delta"))
        if (
          !$util.isInteger(message.delta) &&
          !(
            message.delta &&
            $util.isInteger(message.delta.low) &&
            $util.isInteger(message.delta.high)
          )
        )
          return "delta: integer|Long expected";
      if (message.isHidden != null && message.hasOwnProperty("isHidden"))
        if (typeof message.isHidden !== "boolean") return "isHidden: boolean expected";
      if (message.scoreDescription != null && message.hasOwnProperty("scoreDescription"))
        if (!$util.isString(message.scoreDescription)) return "scoreDescription: string expected";
      if (message.exactlyScore != null && message.hasOwnProperty("exactlyScore"))
        if (!$util.isString(message.exactlyScore)) return "exactlyScore: string expected";
      return null;
    };

    /**
     * Creates a RoomUserSeqMessageContributor message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.RoomUserSeqMessageContributor
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.RoomUserSeqMessageContributor} RoomUserSeqMessageContributor
     */
    RoomUserSeqMessageContributor.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.RoomUserSeqMessageContributor) return object;
      let message = new $root.douyin.RoomUserSeqMessageContributor();
      if (object.score != null)
        if ($util.Long) (message.score = $util.Long.fromValue(object.score)).unsigned = true;
        else if (typeof object.score === "string") message.score = parseInt(object.score, 10);
        else if (typeof object.score === "number") message.score = object.score;
        else if (typeof object.score === "object")
          message.score = new $util.LongBits(
            object.score.low >>> 0,
            object.score.high >>> 0,
          ).toNumber(true);
      if (object.user != null) {
        if (typeof object.user !== "object")
          throw TypeError(".douyin.RoomUserSeqMessageContributor.user: object expected");
        message.user = $root.douyin.User.fromObject(object.user);
      }
      if (object.rank != null)
        if ($util.Long) (message.rank = $util.Long.fromValue(object.rank)).unsigned = true;
        else if (typeof object.rank === "string") message.rank = parseInt(object.rank, 10);
        else if (typeof object.rank === "number") message.rank = object.rank;
        else if (typeof object.rank === "object")
          message.rank = new $util.LongBits(object.rank.low >>> 0, object.rank.high >>> 0).toNumber(
            true,
          );
      if (object.delta != null)
        if ($util.Long) (message.delta = $util.Long.fromValue(object.delta)).unsigned = true;
        else if (typeof object.delta === "string") message.delta = parseInt(object.delta, 10);
        else if (typeof object.delta === "number") message.delta = object.delta;
        else if (typeof object.delta === "object")
          message.delta = new $util.LongBits(
            object.delta.low >>> 0,
            object.delta.high >>> 0,
          ).toNumber(true);
      if (object.isHidden != null) message.isHidden = Boolean(object.isHidden);
      if (object.scoreDescription != null)
        message.scoreDescription = String(object.scoreDescription);
      if (object.exactlyScore != null) message.exactlyScore = String(object.exactlyScore);
      return message;
    };

    /**
     * Creates a plain object from a RoomUserSeqMessageContributor message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.RoomUserSeqMessageContributor
     * @static
     * @param {douyin.RoomUserSeqMessageContributor} message RoomUserSeqMessageContributor
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    RoomUserSeqMessageContributor.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.score =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.score = options.longs === String ? "0" : 0;
        object.user = null;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.rank =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.rank = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.delta =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.delta = options.longs === String ? "0" : 0;
        object.isHidden = false;
        object.scoreDescription = "";
        object.exactlyScore = "";
      }
      if (message.score != null && message.hasOwnProperty("score"))
        if (typeof message.score === "number")
          object.score = options.longs === String ? String(message.score) : message.score;
        else
          object.score =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.score)
              : options.longs === Number
                ? new $util.LongBits(message.score.low >>> 0, message.score.high >>> 0).toNumber(
                    true,
                  )
                : message.score;
      if (message.user != null && message.hasOwnProperty("user"))
        object.user = $root.douyin.User.toObject(message.user, options);
      if (message.rank != null && message.hasOwnProperty("rank"))
        if (typeof message.rank === "number")
          object.rank = options.longs === String ? String(message.rank) : message.rank;
        else
          object.rank =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.rank)
              : options.longs === Number
                ? new $util.LongBits(message.rank.low >>> 0, message.rank.high >>> 0).toNumber(true)
                : message.rank;
      if (message.delta != null && message.hasOwnProperty("delta"))
        if (typeof message.delta === "number")
          object.delta = options.longs === String ? String(message.delta) : message.delta;
        else
          object.delta =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.delta)
              : options.longs === Number
                ? new $util.LongBits(message.delta.low >>> 0, message.delta.high >>> 0).toNumber(
                    true,
                  )
                : message.delta;
      if (message.isHidden != null && message.hasOwnProperty("isHidden"))
        object.isHidden = message.isHidden;
      if (message.scoreDescription != null && message.hasOwnProperty("scoreDescription"))
        object.scoreDescription = message.scoreDescription;
      if (message.exactlyScore != null && message.hasOwnProperty("exactlyScore"))
        object.exactlyScore = message.exactlyScore;
      return object;
    };

    /**
     * Converts this RoomUserSeqMessageContributor to JSON.
     * @function toJSON
     * @memberof douyin.RoomUserSeqMessageContributor
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    RoomUserSeqMessageContributor.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for RoomUserSeqMessageContributor
     * @function getTypeUrl
     * @memberof douyin.RoomUserSeqMessageContributor
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    RoomUserSeqMessageContributor.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.RoomUserSeqMessageContributor";
    };

    return RoomUserSeqMessageContributor;
  })();

  douyin.GiftMessage = (function () {
    /**
     * Properties of a GiftMessage.
     * @memberof douyin
     * @interface IGiftMessage
     * @property {douyin.ICommon|null} [common] GiftMessage common
     * @property {number|Long|null} [giftId] GiftMessage giftId
     * @property {number|Long|null} [fanTicketCount] GiftMessage fanTicketCount
     * @property {number|Long|null} [groupCount] GiftMessage groupCount
     * @property {number|Long|null} [repeatCount] GiftMessage repeatCount
     * @property {number|Long|null} [comboCount] GiftMessage comboCount
     * @property {douyin.IUser|null} [user] GiftMessage user
     * @property {douyin.IUser|null} [toUser] GiftMessage toUser
     * @property {number|null} [repeatEnd] GiftMessage repeatEnd
     * @property {douyin.ITextEffect|null} [textEffect] GiftMessage textEffect
     * @property {number|Long|null} [groupId] GiftMessage groupId
     * @property {number|Long|null} [incomeTaskgifts] GiftMessage incomeTaskgifts
     * @property {number|Long|null} [roomFanTicketCount] GiftMessage roomFanTicketCount
     * @property {douyin.IGiftIMPriority|null} [priority] GiftMessage priority
     * @property {douyin.IGiftStruct|null} [gift] GiftMessage gift
     * @property {string|null} [logId] GiftMessage logId
     * @property {number|Long|null} [sendType] GiftMessage sendType
     * @property {douyin.IPublicAreaCommon|null} [publicAreaCommon] GiftMessage publicAreaCommon
     * @property {douyin.IText|null} [trayDisplayText] GiftMessage trayDisplayText
     * @property {number|Long|null} [bannedDisplayEffects] GiftMessage bannedDisplayEffects
     * @property {boolean|null} [displayForSelf] GiftMessage displayForSelf
     * @property {string|null} [interactGiftInfo] GiftMessage interactGiftInfo
     * @property {string|null} [diyItemInfo] GiftMessage diyItemInfo
     * @property {Array.<number|Long>|null} [minAssetSetList] GiftMessage minAssetSetList
     * @property {number|Long|null} [totalCount] GiftMessage totalCount
     * @property {number|null} [clientGiftSource] GiftMessage clientGiftSource
     * @property {Array.<number|Long>|null} [toUserIdsList] GiftMessage toUserIdsList
     * @property {number|Long|null} [sendTime] GiftMessage sendTime
     * @property {number|Long|null} [forceDisplayEffects] GiftMessage forceDisplayEffects
     * @property {string|null} [traceId] GiftMessage traceId
     * @property {number|Long|null} [effectDisplayTs] GiftMessage effectDisplayTs
     */

    /**
     * Constructs a new GiftMessage.
     * @memberof douyin
     * @classdesc Represents a GiftMessage.
     * @implements IGiftMessage
     * @constructor
     * @param {douyin.IGiftMessage=} [properties] Properties to set
     */
    function GiftMessage(properties) {
      this.minAssetSetList = [];
      this.toUserIdsList = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * GiftMessage common.
     * @member {douyin.ICommon|null|undefined} common
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.common = null;

    /**
     * GiftMessage giftId.
     * @member {number|Long} giftId
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.giftId = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * GiftMessage fanTicketCount.
     * @member {number|Long} fanTicketCount
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.fanTicketCount = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * GiftMessage groupCount.
     * @member {number|Long} groupCount
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.groupCount = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * GiftMessage repeatCount.
     * @member {number|Long} repeatCount
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.repeatCount = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * GiftMessage comboCount.
     * @member {number|Long} comboCount
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.comboCount = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * GiftMessage user.
     * @member {douyin.IUser|null|undefined} user
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.user = null;

    /**
     * GiftMessage toUser.
     * @member {douyin.IUser|null|undefined} toUser
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.toUser = null;

    /**
     * GiftMessage repeatEnd.
     * @member {number} repeatEnd
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.repeatEnd = 0;

    /**
     * GiftMessage textEffect.
     * @member {douyin.ITextEffect|null|undefined} textEffect
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.textEffect = null;

    /**
     * GiftMessage groupId.
     * @member {number|Long} groupId
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.groupId = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * GiftMessage incomeTaskgifts.
     * @member {number|Long} incomeTaskgifts
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.incomeTaskgifts = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * GiftMessage roomFanTicketCount.
     * @member {number|Long} roomFanTicketCount
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.roomFanTicketCount = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * GiftMessage priority.
     * @member {douyin.IGiftIMPriority|null|undefined} priority
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.priority = null;

    /**
     * GiftMessage gift.
     * @member {douyin.IGiftStruct|null|undefined} gift
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.gift = null;

    /**
     * GiftMessage logId.
     * @member {string} logId
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.logId = "";

    /**
     * GiftMessage sendType.
     * @member {number|Long} sendType
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.sendType = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * GiftMessage publicAreaCommon.
     * @member {douyin.IPublicAreaCommon|null|undefined} publicAreaCommon
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.publicAreaCommon = null;

    /**
     * GiftMessage trayDisplayText.
     * @member {douyin.IText|null|undefined} trayDisplayText
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.trayDisplayText = null;

    /**
     * GiftMessage bannedDisplayEffects.
     * @member {number|Long} bannedDisplayEffects
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.bannedDisplayEffects = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * GiftMessage displayForSelf.
     * @member {boolean} displayForSelf
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.displayForSelf = false;

    /**
     * GiftMessage interactGiftInfo.
     * @member {string} interactGiftInfo
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.interactGiftInfo = "";

    /**
     * GiftMessage diyItemInfo.
     * @member {string} diyItemInfo
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.diyItemInfo = "";

    /**
     * GiftMessage minAssetSetList.
     * @member {Array.<number|Long>} minAssetSetList
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.minAssetSetList = $util.emptyArray;

    /**
     * GiftMessage totalCount.
     * @member {number|Long} totalCount
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.totalCount = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * GiftMessage clientGiftSource.
     * @member {number} clientGiftSource
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.clientGiftSource = 0;

    /**
     * GiftMessage toUserIdsList.
     * @member {Array.<number|Long>} toUserIdsList
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.toUserIdsList = $util.emptyArray;

    /**
     * GiftMessage sendTime.
     * @member {number|Long} sendTime
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.sendTime = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * GiftMessage forceDisplayEffects.
     * @member {number|Long} forceDisplayEffects
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.forceDisplayEffects = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * GiftMessage traceId.
     * @member {string} traceId
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.traceId = "";

    /**
     * GiftMessage effectDisplayTs.
     * @member {number|Long} effectDisplayTs
     * @memberof douyin.GiftMessage
     * @instance
     */
    GiftMessage.prototype.effectDisplayTs = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Creates a new GiftMessage instance using the specified properties.
     * @function create
     * @memberof douyin.GiftMessage
     * @static
     * @param {douyin.IGiftMessage=} [properties] Properties to set
     * @returns {douyin.GiftMessage} GiftMessage instance
     */
    GiftMessage.create = function create(properties) {
      return new GiftMessage(properties);
    };

    /**
     * Encodes the specified GiftMessage message. Does not implicitly {@link douyin.GiftMessage.verify|verify} messages.
     * @function encode
     * @memberof douyin.GiftMessage
     * @static
     * @param {douyin.IGiftMessage} message GiftMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GiftMessage.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.common != null && Object.hasOwnProperty.call(message, "common"))
        $root.douyin.Common.encode(
          message.common,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (message.giftId != null && Object.hasOwnProperty.call(message, "giftId"))
        writer.uint32(/* id 2, wireType 0 =*/ 16).uint64(message.giftId);
      if (message.fanTicketCount != null && Object.hasOwnProperty.call(message, "fanTicketCount"))
        writer.uint32(/* id 3, wireType 0 =*/ 24).uint64(message.fanTicketCount);
      if (message.groupCount != null && Object.hasOwnProperty.call(message, "groupCount"))
        writer.uint32(/* id 4, wireType 0 =*/ 32).uint64(message.groupCount);
      if (message.repeatCount != null && Object.hasOwnProperty.call(message, "repeatCount"))
        writer.uint32(/* id 5, wireType 0 =*/ 40).uint64(message.repeatCount);
      if (message.comboCount != null && Object.hasOwnProperty.call(message, "comboCount"))
        writer.uint32(/* id 6, wireType 0 =*/ 48).uint64(message.comboCount);
      if (message.user != null && Object.hasOwnProperty.call(message, "user"))
        $root.douyin.User.encode(
          message.user,
          writer.uint32(/* id 7, wireType 2 =*/ 58).fork(),
        ).ldelim();
      if (message.toUser != null && Object.hasOwnProperty.call(message, "toUser"))
        $root.douyin.User.encode(
          message.toUser,
          writer.uint32(/* id 8, wireType 2 =*/ 66).fork(),
        ).ldelim();
      if (message.repeatEnd != null && Object.hasOwnProperty.call(message, "repeatEnd"))
        writer.uint32(/* id 9, wireType 0 =*/ 72).uint32(message.repeatEnd);
      if (message.textEffect != null && Object.hasOwnProperty.call(message, "textEffect"))
        $root.douyin.TextEffect.encode(
          message.textEffect,
          writer.uint32(/* id 10, wireType 2 =*/ 82).fork(),
        ).ldelim();
      if (message.groupId != null && Object.hasOwnProperty.call(message, "groupId"))
        writer.uint32(/* id 11, wireType 0 =*/ 88).uint64(message.groupId);
      if (message.incomeTaskgifts != null && Object.hasOwnProperty.call(message, "incomeTaskgifts"))
        writer.uint32(/* id 12, wireType 0 =*/ 96).uint64(message.incomeTaskgifts);
      if (
        message.roomFanTicketCount != null &&
        Object.hasOwnProperty.call(message, "roomFanTicketCount")
      )
        writer.uint32(/* id 13, wireType 0 =*/ 104).uint64(message.roomFanTicketCount);
      if (message.priority != null && Object.hasOwnProperty.call(message, "priority"))
        $root.douyin.GiftIMPriority.encode(
          message.priority,
          writer.uint32(/* id 14, wireType 2 =*/ 114).fork(),
        ).ldelim();
      if (message.gift != null && Object.hasOwnProperty.call(message, "gift"))
        $root.douyin.GiftStruct.encode(
          message.gift,
          writer.uint32(/* id 15, wireType 2 =*/ 122).fork(),
        ).ldelim();
      if (message.logId != null && Object.hasOwnProperty.call(message, "logId"))
        writer.uint32(/* id 16, wireType 2 =*/ 130).string(message.logId);
      if (message.sendType != null && Object.hasOwnProperty.call(message, "sendType"))
        writer.uint32(/* id 17, wireType 0 =*/ 136).uint64(message.sendType);
      if (
        message.publicAreaCommon != null &&
        Object.hasOwnProperty.call(message, "publicAreaCommon")
      )
        $root.douyin.PublicAreaCommon.encode(
          message.publicAreaCommon,
          writer.uint32(/* id 18, wireType 2 =*/ 146).fork(),
        ).ldelim();
      if (message.trayDisplayText != null && Object.hasOwnProperty.call(message, "trayDisplayText"))
        $root.douyin.Text.encode(
          message.trayDisplayText,
          writer.uint32(/* id 19, wireType 2 =*/ 154).fork(),
        ).ldelim();
      if (
        message.bannedDisplayEffects != null &&
        Object.hasOwnProperty.call(message, "bannedDisplayEffects")
      )
        writer.uint32(/* id 20, wireType 0 =*/ 160).uint64(message.bannedDisplayEffects);
      if (message.displayForSelf != null && Object.hasOwnProperty.call(message, "displayForSelf"))
        writer.uint32(/* id 25, wireType 0 =*/ 200).bool(message.displayForSelf);
      if (
        message.interactGiftInfo != null &&
        Object.hasOwnProperty.call(message, "interactGiftInfo")
      )
        writer.uint32(/* id 26, wireType 2 =*/ 210).string(message.interactGiftInfo);
      if (message.diyItemInfo != null && Object.hasOwnProperty.call(message, "diyItemInfo"))
        writer.uint32(/* id 27, wireType 2 =*/ 218).string(message.diyItemInfo);
      if (message.minAssetSetList != null && message.minAssetSetList.length) {
        writer.uint32(/* id 28, wireType 2 =*/ 226).fork();
        for (let i = 0; i < message.minAssetSetList.length; ++i)
          writer.uint64(message.minAssetSetList[i]);
        writer.ldelim();
      }
      if (message.totalCount != null && Object.hasOwnProperty.call(message, "totalCount"))
        writer.uint32(/* id 29, wireType 0 =*/ 232).uint64(message.totalCount);
      if (
        message.clientGiftSource != null &&
        Object.hasOwnProperty.call(message, "clientGiftSource")
      )
        writer.uint32(/* id 30, wireType 0 =*/ 240).uint32(message.clientGiftSource);
      if (message.toUserIdsList != null && message.toUserIdsList.length) {
        writer.uint32(/* id 32, wireType 2 =*/ 258).fork();
        for (let i = 0; i < message.toUserIdsList.length; ++i)
          writer.uint64(message.toUserIdsList[i]);
        writer.ldelim();
      }
      if (message.sendTime != null && Object.hasOwnProperty.call(message, "sendTime"))
        writer.uint32(/* id 33, wireType 0 =*/ 264).uint64(message.sendTime);
      if (
        message.forceDisplayEffects != null &&
        Object.hasOwnProperty.call(message, "forceDisplayEffects")
      )
        writer.uint32(/* id 34, wireType 0 =*/ 272).uint64(message.forceDisplayEffects);
      if (message.traceId != null && Object.hasOwnProperty.call(message, "traceId"))
        writer.uint32(/* id 35, wireType 2 =*/ 282).string(message.traceId);
      if (message.effectDisplayTs != null && Object.hasOwnProperty.call(message, "effectDisplayTs"))
        writer.uint32(/* id 36, wireType 0 =*/ 288).uint64(message.effectDisplayTs);
      return writer;
    };

    /**
     * Encodes the specified GiftMessage message, length delimited. Does not implicitly {@link douyin.GiftMessage.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.GiftMessage
     * @static
     * @param {douyin.IGiftMessage} message GiftMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GiftMessage.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a GiftMessage message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.GiftMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.GiftMessage} GiftMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GiftMessage.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.GiftMessage();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.common = $root.douyin.Common.decode(reader, reader.uint32());
            break;
          }
          case 2: {
            message.giftId = reader.uint64();
            break;
          }
          case 3: {
            message.fanTicketCount = reader.uint64();
            break;
          }
          case 4: {
            message.groupCount = reader.uint64();
            break;
          }
          case 5: {
            message.repeatCount = reader.uint64();
            break;
          }
          case 6: {
            message.comboCount = reader.uint64();
            break;
          }
          case 7: {
            message.user = $root.douyin.User.decode(reader, reader.uint32());
            break;
          }
          case 8: {
            message.toUser = $root.douyin.User.decode(reader, reader.uint32());
            break;
          }
          case 9: {
            message.repeatEnd = reader.uint32();
            break;
          }
          case 10: {
            message.textEffect = $root.douyin.TextEffect.decode(reader, reader.uint32());
            break;
          }
          case 11: {
            message.groupId = reader.uint64();
            break;
          }
          case 12: {
            message.incomeTaskgifts = reader.uint64();
            break;
          }
          case 13: {
            message.roomFanTicketCount = reader.uint64();
            break;
          }
          case 14: {
            message.priority = $root.douyin.GiftIMPriority.decode(reader, reader.uint32());
            break;
          }
          case 15: {
            message.gift = $root.douyin.GiftStruct.decode(reader, reader.uint32());
            break;
          }
          case 16: {
            message.logId = reader.string();
            break;
          }
          case 17: {
            message.sendType = reader.uint64();
            break;
          }
          case 18: {
            message.publicAreaCommon = $root.douyin.PublicAreaCommon.decode(
              reader,
              reader.uint32(),
            );
            break;
          }
          case 19: {
            message.trayDisplayText = $root.douyin.Text.decode(reader, reader.uint32());
            break;
          }
          case 20: {
            message.bannedDisplayEffects = reader.uint64();
            break;
          }
          case 25: {
            message.displayForSelf = reader.bool();
            break;
          }
          case 26: {
            message.interactGiftInfo = reader.string();
            break;
          }
          case 27: {
            message.diyItemInfo = reader.string();
            break;
          }
          case 28: {
            if (!(message.minAssetSetList && message.minAssetSetList.length))
              message.minAssetSetList = [];
            if ((tag & 7) === 2) {
              let end2 = reader.uint32() + reader.pos;
              while (reader.pos < end2) message.minAssetSetList.push(reader.uint64());
            } else message.minAssetSetList.push(reader.uint64());
            break;
          }
          case 29: {
            message.totalCount = reader.uint64();
            break;
          }
          case 30: {
            message.clientGiftSource = reader.uint32();
            break;
          }
          case 32: {
            if (!(message.toUserIdsList && message.toUserIdsList.length))
              message.toUserIdsList = [];
            if ((tag & 7) === 2) {
              let end2 = reader.uint32() + reader.pos;
              while (reader.pos < end2) message.toUserIdsList.push(reader.uint64());
            } else message.toUserIdsList.push(reader.uint64());
            break;
          }
          case 33: {
            message.sendTime = reader.uint64();
            break;
          }
          case 34: {
            message.forceDisplayEffects = reader.uint64();
            break;
          }
          case 35: {
            message.traceId = reader.string();
            break;
          }
          case 36: {
            message.effectDisplayTs = reader.uint64();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a GiftMessage message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.GiftMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.GiftMessage} GiftMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GiftMessage.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a GiftMessage message.
     * @function verify
     * @memberof douyin.GiftMessage
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    GiftMessage.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.common != null && message.hasOwnProperty("common")) {
        let error = $root.douyin.Common.verify(message.common);
        if (error) return "common." + error;
      }
      if (message.giftId != null && message.hasOwnProperty("giftId"))
        if (
          !$util.isInteger(message.giftId) &&
          !(
            message.giftId &&
            $util.isInteger(message.giftId.low) &&
            $util.isInteger(message.giftId.high)
          )
        )
          return "giftId: integer|Long expected";
      if (message.fanTicketCount != null && message.hasOwnProperty("fanTicketCount"))
        if (
          !$util.isInteger(message.fanTicketCount) &&
          !(
            message.fanTicketCount &&
            $util.isInteger(message.fanTicketCount.low) &&
            $util.isInteger(message.fanTicketCount.high)
          )
        )
          return "fanTicketCount: integer|Long expected";
      if (message.groupCount != null && message.hasOwnProperty("groupCount"))
        if (
          !$util.isInteger(message.groupCount) &&
          !(
            message.groupCount &&
            $util.isInteger(message.groupCount.low) &&
            $util.isInteger(message.groupCount.high)
          )
        )
          return "groupCount: integer|Long expected";
      if (message.repeatCount != null && message.hasOwnProperty("repeatCount"))
        if (
          !$util.isInteger(message.repeatCount) &&
          !(
            message.repeatCount &&
            $util.isInteger(message.repeatCount.low) &&
            $util.isInteger(message.repeatCount.high)
          )
        )
          return "repeatCount: integer|Long expected";
      if (message.comboCount != null && message.hasOwnProperty("comboCount"))
        if (
          !$util.isInteger(message.comboCount) &&
          !(
            message.comboCount &&
            $util.isInteger(message.comboCount.low) &&
            $util.isInteger(message.comboCount.high)
          )
        )
          return "comboCount: integer|Long expected";
      if (message.user != null && message.hasOwnProperty("user")) {
        let error = $root.douyin.User.verify(message.user);
        if (error) return "user." + error;
      }
      if (message.toUser != null && message.hasOwnProperty("toUser")) {
        let error = $root.douyin.User.verify(message.toUser);
        if (error) return "toUser." + error;
      }
      if (message.repeatEnd != null && message.hasOwnProperty("repeatEnd"))
        if (!$util.isInteger(message.repeatEnd)) return "repeatEnd: integer expected";
      if (message.textEffect != null && message.hasOwnProperty("textEffect")) {
        let error = $root.douyin.TextEffect.verify(message.textEffect);
        if (error) return "textEffect." + error;
      }
      if (message.groupId != null && message.hasOwnProperty("groupId"))
        if (
          !$util.isInteger(message.groupId) &&
          !(
            message.groupId &&
            $util.isInteger(message.groupId.low) &&
            $util.isInteger(message.groupId.high)
          )
        )
          return "groupId: integer|Long expected";
      if (message.incomeTaskgifts != null && message.hasOwnProperty("incomeTaskgifts"))
        if (
          !$util.isInteger(message.incomeTaskgifts) &&
          !(
            message.incomeTaskgifts &&
            $util.isInteger(message.incomeTaskgifts.low) &&
            $util.isInteger(message.incomeTaskgifts.high)
          )
        )
          return "incomeTaskgifts: integer|Long expected";
      if (message.roomFanTicketCount != null && message.hasOwnProperty("roomFanTicketCount"))
        if (
          !$util.isInteger(message.roomFanTicketCount) &&
          !(
            message.roomFanTicketCount &&
            $util.isInteger(message.roomFanTicketCount.low) &&
            $util.isInteger(message.roomFanTicketCount.high)
          )
        )
          return "roomFanTicketCount: integer|Long expected";
      if (message.priority != null && message.hasOwnProperty("priority")) {
        let error = $root.douyin.GiftIMPriority.verify(message.priority);
        if (error) return "priority." + error;
      }
      if (message.gift != null && message.hasOwnProperty("gift")) {
        let error = $root.douyin.GiftStruct.verify(message.gift);
        if (error) return "gift." + error;
      }
      if (message.logId != null && message.hasOwnProperty("logId"))
        if (!$util.isString(message.logId)) return "logId: string expected";
      if (message.sendType != null && message.hasOwnProperty("sendType"))
        if (
          !$util.isInteger(message.sendType) &&
          !(
            message.sendType &&
            $util.isInteger(message.sendType.low) &&
            $util.isInteger(message.sendType.high)
          )
        )
          return "sendType: integer|Long expected";
      if (message.publicAreaCommon != null && message.hasOwnProperty("publicAreaCommon")) {
        let error = $root.douyin.PublicAreaCommon.verify(message.publicAreaCommon);
        if (error) return "publicAreaCommon." + error;
      }
      if (message.trayDisplayText != null && message.hasOwnProperty("trayDisplayText")) {
        let error = $root.douyin.Text.verify(message.trayDisplayText);
        if (error) return "trayDisplayText." + error;
      }
      if (message.bannedDisplayEffects != null && message.hasOwnProperty("bannedDisplayEffects"))
        if (
          !$util.isInteger(message.bannedDisplayEffects) &&
          !(
            message.bannedDisplayEffects &&
            $util.isInteger(message.bannedDisplayEffects.low) &&
            $util.isInteger(message.bannedDisplayEffects.high)
          )
        )
          return "bannedDisplayEffects: integer|Long expected";
      if (message.displayForSelf != null && message.hasOwnProperty("displayForSelf"))
        if (typeof message.displayForSelf !== "boolean") return "displayForSelf: boolean expected";
      if (message.interactGiftInfo != null && message.hasOwnProperty("interactGiftInfo"))
        if (!$util.isString(message.interactGiftInfo)) return "interactGiftInfo: string expected";
      if (message.diyItemInfo != null && message.hasOwnProperty("diyItemInfo"))
        if (!$util.isString(message.diyItemInfo)) return "diyItemInfo: string expected";
      if (message.minAssetSetList != null && message.hasOwnProperty("minAssetSetList")) {
        if (!Array.isArray(message.minAssetSetList)) return "minAssetSetList: array expected";
        for (let i = 0; i < message.minAssetSetList.length; ++i)
          if (
            !$util.isInteger(message.minAssetSetList[i]) &&
            !(
              message.minAssetSetList[i] &&
              $util.isInteger(message.minAssetSetList[i].low) &&
              $util.isInteger(message.minAssetSetList[i].high)
            )
          )
            return "minAssetSetList: integer|Long[] expected";
      }
      if (message.totalCount != null && message.hasOwnProperty("totalCount"))
        if (
          !$util.isInteger(message.totalCount) &&
          !(
            message.totalCount &&
            $util.isInteger(message.totalCount.low) &&
            $util.isInteger(message.totalCount.high)
          )
        )
          return "totalCount: integer|Long expected";
      if (message.clientGiftSource != null && message.hasOwnProperty("clientGiftSource"))
        if (!$util.isInteger(message.clientGiftSource)) return "clientGiftSource: integer expected";
      if (message.toUserIdsList != null && message.hasOwnProperty("toUserIdsList")) {
        if (!Array.isArray(message.toUserIdsList)) return "toUserIdsList: array expected";
        for (let i = 0; i < message.toUserIdsList.length; ++i)
          if (
            !$util.isInteger(message.toUserIdsList[i]) &&
            !(
              message.toUserIdsList[i] &&
              $util.isInteger(message.toUserIdsList[i].low) &&
              $util.isInteger(message.toUserIdsList[i].high)
            )
          )
            return "toUserIdsList: integer|Long[] expected";
      }
      if (message.sendTime != null && message.hasOwnProperty("sendTime"))
        if (
          !$util.isInteger(message.sendTime) &&
          !(
            message.sendTime &&
            $util.isInteger(message.sendTime.low) &&
            $util.isInteger(message.sendTime.high)
          )
        )
          return "sendTime: integer|Long expected";
      if (message.forceDisplayEffects != null && message.hasOwnProperty("forceDisplayEffects"))
        if (
          !$util.isInteger(message.forceDisplayEffects) &&
          !(
            message.forceDisplayEffects &&
            $util.isInteger(message.forceDisplayEffects.low) &&
            $util.isInteger(message.forceDisplayEffects.high)
          )
        )
          return "forceDisplayEffects: integer|Long expected";
      if (message.traceId != null && message.hasOwnProperty("traceId"))
        if (!$util.isString(message.traceId)) return "traceId: string expected";
      if (message.effectDisplayTs != null && message.hasOwnProperty("effectDisplayTs"))
        if (
          !$util.isInteger(message.effectDisplayTs) &&
          !(
            message.effectDisplayTs &&
            $util.isInteger(message.effectDisplayTs.low) &&
            $util.isInteger(message.effectDisplayTs.high)
          )
        )
          return "effectDisplayTs: integer|Long expected";
      return null;
    };

    /**
     * Creates a GiftMessage message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.GiftMessage
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.GiftMessage} GiftMessage
     */
    GiftMessage.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.GiftMessage) return object;
      let message = new $root.douyin.GiftMessage();
      if (object.common != null) {
        if (typeof object.common !== "object")
          throw TypeError(".douyin.GiftMessage.common: object expected");
        message.common = $root.douyin.Common.fromObject(object.common);
      }
      if (object.giftId != null)
        if ($util.Long) (message.giftId = $util.Long.fromValue(object.giftId)).unsigned = true;
        else if (typeof object.giftId === "string") message.giftId = parseInt(object.giftId, 10);
        else if (typeof object.giftId === "number") message.giftId = object.giftId;
        else if (typeof object.giftId === "object")
          message.giftId = new $util.LongBits(
            object.giftId.low >>> 0,
            object.giftId.high >>> 0,
          ).toNumber(true);
      if (object.fanTicketCount != null)
        if ($util.Long)
          (message.fanTicketCount = $util.Long.fromValue(object.fanTicketCount)).unsigned = true;
        else if (typeof object.fanTicketCount === "string")
          message.fanTicketCount = parseInt(object.fanTicketCount, 10);
        else if (typeof object.fanTicketCount === "number")
          message.fanTicketCount = object.fanTicketCount;
        else if (typeof object.fanTicketCount === "object")
          message.fanTicketCount = new $util.LongBits(
            object.fanTicketCount.low >>> 0,
            object.fanTicketCount.high >>> 0,
          ).toNumber(true);
      if (object.groupCount != null)
        if ($util.Long)
          (message.groupCount = $util.Long.fromValue(object.groupCount)).unsigned = true;
        else if (typeof object.groupCount === "string")
          message.groupCount = parseInt(object.groupCount, 10);
        else if (typeof object.groupCount === "number") message.groupCount = object.groupCount;
        else if (typeof object.groupCount === "object")
          message.groupCount = new $util.LongBits(
            object.groupCount.low >>> 0,
            object.groupCount.high >>> 0,
          ).toNumber(true);
      if (object.repeatCount != null)
        if ($util.Long)
          (message.repeatCount = $util.Long.fromValue(object.repeatCount)).unsigned = true;
        else if (typeof object.repeatCount === "string")
          message.repeatCount = parseInt(object.repeatCount, 10);
        else if (typeof object.repeatCount === "number") message.repeatCount = object.repeatCount;
        else if (typeof object.repeatCount === "object")
          message.repeatCount = new $util.LongBits(
            object.repeatCount.low >>> 0,
            object.repeatCount.high >>> 0,
          ).toNumber(true);
      if (object.comboCount != null)
        if ($util.Long)
          (message.comboCount = $util.Long.fromValue(object.comboCount)).unsigned = true;
        else if (typeof object.comboCount === "string")
          message.comboCount = parseInt(object.comboCount, 10);
        else if (typeof object.comboCount === "number") message.comboCount = object.comboCount;
        else if (typeof object.comboCount === "object")
          message.comboCount = new $util.LongBits(
            object.comboCount.low >>> 0,
            object.comboCount.high >>> 0,
          ).toNumber(true);
      if (object.user != null) {
        if (typeof object.user !== "object")
          throw TypeError(".douyin.GiftMessage.user: object expected");
        message.user = $root.douyin.User.fromObject(object.user);
      }
      if (object.toUser != null) {
        if (typeof object.toUser !== "object")
          throw TypeError(".douyin.GiftMessage.toUser: object expected");
        message.toUser = $root.douyin.User.fromObject(object.toUser);
      }
      if (object.repeatEnd != null) message.repeatEnd = object.repeatEnd >>> 0;
      if (object.textEffect != null) {
        if (typeof object.textEffect !== "object")
          throw TypeError(".douyin.GiftMessage.textEffect: object expected");
        message.textEffect = $root.douyin.TextEffect.fromObject(object.textEffect);
      }
      if (object.groupId != null)
        if ($util.Long) (message.groupId = $util.Long.fromValue(object.groupId)).unsigned = true;
        else if (typeof object.groupId === "string") message.groupId = parseInt(object.groupId, 10);
        else if (typeof object.groupId === "number") message.groupId = object.groupId;
        else if (typeof object.groupId === "object")
          message.groupId = new $util.LongBits(
            object.groupId.low >>> 0,
            object.groupId.high >>> 0,
          ).toNumber(true);
      if (object.incomeTaskgifts != null)
        if ($util.Long)
          (message.incomeTaskgifts = $util.Long.fromValue(object.incomeTaskgifts)).unsigned = true;
        else if (typeof object.incomeTaskgifts === "string")
          message.incomeTaskgifts = parseInt(object.incomeTaskgifts, 10);
        else if (typeof object.incomeTaskgifts === "number")
          message.incomeTaskgifts = object.incomeTaskgifts;
        else if (typeof object.incomeTaskgifts === "object")
          message.incomeTaskgifts = new $util.LongBits(
            object.incomeTaskgifts.low >>> 0,
            object.incomeTaskgifts.high >>> 0,
          ).toNumber(true);
      if (object.roomFanTicketCount != null)
        if ($util.Long)
          (message.roomFanTicketCount = $util.Long.fromValue(object.roomFanTicketCount)).unsigned =
            true;
        else if (typeof object.roomFanTicketCount === "string")
          message.roomFanTicketCount = parseInt(object.roomFanTicketCount, 10);
        else if (typeof object.roomFanTicketCount === "number")
          message.roomFanTicketCount = object.roomFanTicketCount;
        else if (typeof object.roomFanTicketCount === "object")
          message.roomFanTicketCount = new $util.LongBits(
            object.roomFanTicketCount.low >>> 0,
            object.roomFanTicketCount.high >>> 0,
          ).toNumber(true);
      if (object.priority != null) {
        if (typeof object.priority !== "object")
          throw TypeError(".douyin.GiftMessage.priority: object expected");
        message.priority = $root.douyin.GiftIMPriority.fromObject(object.priority);
      }
      if (object.gift != null) {
        if (typeof object.gift !== "object")
          throw TypeError(".douyin.GiftMessage.gift: object expected");
        message.gift = $root.douyin.GiftStruct.fromObject(object.gift);
      }
      if (object.logId != null) message.logId = String(object.logId);
      if (object.sendType != null)
        if ($util.Long) (message.sendType = $util.Long.fromValue(object.sendType)).unsigned = true;
        else if (typeof object.sendType === "string")
          message.sendType = parseInt(object.sendType, 10);
        else if (typeof object.sendType === "number") message.sendType = object.sendType;
        else if (typeof object.sendType === "object")
          message.sendType = new $util.LongBits(
            object.sendType.low >>> 0,
            object.sendType.high >>> 0,
          ).toNumber(true);
      if (object.publicAreaCommon != null) {
        if (typeof object.publicAreaCommon !== "object")
          throw TypeError(".douyin.GiftMessage.publicAreaCommon: object expected");
        message.publicAreaCommon = $root.douyin.PublicAreaCommon.fromObject(
          object.publicAreaCommon,
        );
      }
      if (object.trayDisplayText != null) {
        if (typeof object.trayDisplayText !== "object")
          throw TypeError(".douyin.GiftMessage.trayDisplayText: object expected");
        message.trayDisplayText = $root.douyin.Text.fromObject(object.trayDisplayText);
      }
      if (object.bannedDisplayEffects != null)
        if ($util.Long)
          (message.bannedDisplayEffects = $util.Long.fromValue(
            object.bannedDisplayEffects,
          )).unsigned = true;
        else if (typeof object.bannedDisplayEffects === "string")
          message.bannedDisplayEffects = parseInt(object.bannedDisplayEffects, 10);
        else if (typeof object.bannedDisplayEffects === "number")
          message.bannedDisplayEffects = object.bannedDisplayEffects;
        else if (typeof object.bannedDisplayEffects === "object")
          message.bannedDisplayEffects = new $util.LongBits(
            object.bannedDisplayEffects.low >>> 0,
            object.bannedDisplayEffects.high >>> 0,
          ).toNumber(true);
      if (object.displayForSelf != null) message.displayForSelf = Boolean(object.displayForSelf);
      if (object.interactGiftInfo != null)
        message.interactGiftInfo = String(object.interactGiftInfo);
      if (object.diyItemInfo != null) message.diyItemInfo = String(object.diyItemInfo);
      if (object.minAssetSetList) {
        if (!Array.isArray(object.minAssetSetList))
          throw TypeError(".douyin.GiftMessage.minAssetSetList: array expected");
        message.minAssetSetList = [];
        for (let i = 0; i < object.minAssetSetList.length; ++i)
          if ($util.Long)
            (message.minAssetSetList[i] = $util.Long.fromValue(
              object.minAssetSetList[i],
            )).unsigned = true;
          else if (typeof object.minAssetSetList[i] === "string")
            message.minAssetSetList[i] = parseInt(object.minAssetSetList[i], 10);
          else if (typeof object.minAssetSetList[i] === "number")
            message.minAssetSetList[i] = object.minAssetSetList[i];
          else if (typeof object.minAssetSetList[i] === "object")
            message.minAssetSetList[i] = new $util.LongBits(
              object.minAssetSetList[i].low >>> 0,
              object.minAssetSetList[i].high >>> 0,
            ).toNumber(true);
      }
      if (object.totalCount != null)
        if ($util.Long)
          (message.totalCount = $util.Long.fromValue(object.totalCount)).unsigned = true;
        else if (typeof object.totalCount === "string")
          message.totalCount = parseInt(object.totalCount, 10);
        else if (typeof object.totalCount === "number") message.totalCount = object.totalCount;
        else if (typeof object.totalCount === "object")
          message.totalCount = new $util.LongBits(
            object.totalCount.low >>> 0,
            object.totalCount.high >>> 0,
          ).toNumber(true);
      if (object.clientGiftSource != null) message.clientGiftSource = object.clientGiftSource >>> 0;
      if (object.toUserIdsList) {
        if (!Array.isArray(object.toUserIdsList))
          throw TypeError(".douyin.GiftMessage.toUserIdsList: array expected");
        message.toUserIdsList = [];
        for (let i = 0; i < object.toUserIdsList.length; ++i)
          if ($util.Long)
            (message.toUserIdsList[i] = $util.Long.fromValue(object.toUserIdsList[i])).unsigned =
              true;
          else if (typeof object.toUserIdsList[i] === "string")
            message.toUserIdsList[i] = parseInt(object.toUserIdsList[i], 10);
          else if (typeof object.toUserIdsList[i] === "number")
            message.toUserIdsList[i] = object.toUserIdsList[i];
          else if (typeof object.toUserIdsList[i] === "object")
            message.toUserIdsList[i] = new $util.LongBits(
              object.toUserIdsList[i].low >>> 0,
              object.toUserIdsList[i].high >>> 0,
            ).toNumber(true);
      }
      if (object.sendTime != null)
        if ($util.Long) (message.sendTime = $util.Long.fromValue(object.sendTime)).unsigned = true;
        else if (typeof object.sendTime === "string")
          message.sendTime = parseInt(object.sendTime, 10);
        else if (typeof object.sendTime === "number") message.sendTime = object.sendTime;
        else if (typeof object.sendTime === "object")
          message.sendTime = new $util.LongBits(
            object.sendTime.low >>> 0,
            object.sendTime.high >>> 0,
          ).toNumber(true);
      if (object.forceDisplayEffects != null)
        if ($util.Long)
          (message.forceDisplayEffects = $util.Long.fromValue(
            object.forceDisplayEffects,
          )).unsigned = true;
        else if (typeof object.forceDisplayEffects === "string")
          message.forceDisplayEffects = parseInt(object.forceDisplayEffects, 10);
        else if (typeof object.forceDisplayEffects === "number")
          message.forceDisplayEffects = object.forceDisplayEffects;
        else if (typeof object.forceDisplayEffects === "object")
          message.forceDisplayEffects = new $util.LongBits(
            object.forceDisplayEffects.low >>> 0,
            object.forceDisplayEffects.high >>> 0,
          ).toNumber(true);
      if (object.traceId != null) message.traceId = String(object.traceId);
      if (object.effectDisplayTs != null)
        if ($util.Long)
          (message.effectDisplayTs = $util.Long.fromValue(object.effectDisplayTs)).unsigned = true;
        else if (typeof object.effectDisplayTs === "string")
          message.effectDisplayTs = parseInt(object.effectDisplayTs, 10);
        else if (typeof object.effectDisplayTs === "number")
          message.effectDisplayTs = object.effectDisplayTs;
        else if (typeof object.effectDisplayTs === "object")
          message.effectDisplayTs = new $util.LongBits(
            object.effectDisplayTs.low >>> 0,
            object.effectDisplayTs.high >>> 0,
          ).toNumber(true);
      return message;
    };

    /**
     * Creates a plain object from a GiftMessage message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.GiftMessage
     * @static
     * @param {douyin.GiftMessage} message GiftMessage
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    GiftMessage.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) {
        object.minAssetSetList = [];
        object.toUserIdsList = [];
      }
      if (options.defaults) {
        object.common = null;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.giftId =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.giftId = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.fanTicketCount =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.fanTicketCount = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.groupCount =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.groupCount = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.repeatCount =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.repeatCount = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.comboCount =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.comboCount = options.longs === String ? "0" : 0;
        object.user = null;
        object.toUser = null;
        object.repeatEnd = 0;
        object.textEffect = null;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.groupId =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.groupId = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.incomeTaskgifts =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.incomeTaskgifts = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.roomFanTicketCount =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.roomFanTicketCount = options.longs === String ? "0" : 0;
        object.priority = null;
        object.gift = null;
        object.logId = "";
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.sendType =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.sendType = options.longs === String ? "0" : 0;
        object.publicAreaCommon = null;
        object.trayDisplayText = null;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.bannedDisplayEffects =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.bannedDisplayEffects = options.longs === String ? "0" : 0;
        object.displayForSelf = false;
        object.interactGiftInfo = "";
        object.diyItemInfo = "";
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.totalCount =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.totalCount = options.longs === String ? "0" : 0;
        object.clientGiftSource = 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.sendTime =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.sendTime = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.forceDisplayEffects =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.forceDisplayEffects = options.longs === String ? "0" : 0;
        object.traceId = "";
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.effectDisplayTs =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.effectDisplayTs = options.longs === String ? "0" : 0;
      }
      if (message.common != null && message.hasOwnProperty("common"))
        object.common = $root.douyin.Common.toObject(message.common, options);
      if (message.giftId != null && message.hasOwnProperty("giftId"))
        if (typeof message.giftId === "number")
          object.giftId = options.longs === String ? String(message.giftId) : message.giftId;
        else
          object.giftId =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.giftId)
              : options.longs === Number
                ? new $util.LongBits(message.giftId.low >>> 0, message.giftId.high >>> 0).toNumber(
                    true,
                  )
                : message.giftId;
      if (message.fanTicketCount != null && message.hasOwnProperty("fanTicketCount"))
        if (typeof message.fanTicketCount === "number")
          object.fanTicketCount =
            options.longs === String ? String(message.fanTicketCount) : message.fanTicketCount;
        else
          object.fanTicketCount =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.fanTicketCount)
              : options.longs === Number
                ? new $util.LongBits(
                    message.fanTicketCount.low >>> 0,
                    message.fanTicketCount.high >>> 0,
                  ).toNumber(true)
                : message.fanTicketCount;
      if (message.groupCount != null && message.hasOwnProperty("groupCount"))
        if (typeof message.groupCount === "number")
          object.groupCount =
            options.longs === String ? String(message.groupCount) : message.groupCount;
        else
          object.groupCount =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.groupCount)
              : options.longs === Number
                ? new $util.LongBits(
                    message.groupCount.low >>> 0,
                    message.groupCount.high >>> 0,
                  ).toNumber(true)
                : message.groupCount;
      if (message.repeatCount != null && message.hasOwnProperty("repeatCount"))
        if (typeof message.repeatCount === "number")
          object.repeatCount =
            options.longs === String ? String(message.repeatCount) : message.repeatCount;
        else
          object.repeatCount =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.repeatCount)
              : options.longs === Number
                ? new $util.LongBits(
                    message.repeatCount.low >>> 0,
                    message.repeatCount.high >>> 0,
                  ).toNumber(true)
                : message.repeatCount;
      if (message.comboCount != null && message.hasOwnProperty("comboCount"))
        if (typeof message.comboCount === "number")
          object.comboCount =
            options.longs === String ? String(message.comboCount) : message.comboCount;
        else
          object.comboCount =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.comboCount)
              : options.longs === Number
                ? new $util.LongBits(
                    message.comboCount.low >>> 0,
                    message.comboCount.high >>> 0,
                  ).toNumber(true)
                : message.comboCount;
      if (message.user != null && message.hasOwnProperty("user"))
        object.user = $root.douyin.User.toObject(message.user, options);
      if (message.toUser != null && message.hasOwnProperty("toUser"))
        object.toUser = $root.douyin.User.toObject(message.toUser, options);
      if (message.repeatEnd != null && message.hasOwnProperty("repeatEnd"))
        object.repeatEnd = message.repeatEnd;
      if (message.textEffect != null && message.hasOwnProperty("textEffect"))
        object.textEffect = $root.douyin.TextEffect.toObject(message.textEffect, options);
      if (message.groupId != null && message.hasOwnProperty("groupId"))
        if (typeof message.groupId === "number")
          object.groupId = options.longs === String ? String(message.groupId) : message.groupId;
        else
          object.groupId =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.groupId)
              : options.longs === Number
                ? new $util.LongBits(
                    message.groupId.low >>> 0,
                    message.groupId.high >>> 0,
                  ).toNumber(true)
                : message.groupId;
      if (message.incomeTaskgifts != null && message.hasOwnProperty("incomeTaskgifts"))
        if (typeof message.incomeTaskgifts === "number")
          object.incomeTaskgifts =
            options.longs === String ? String(message.incomeTaskgifts) : message.incomeTaskgifts;
        else
          object.incomeTaskgifts =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.incomeTaskgifts)
              : options.longs === Number
                ? new $util.LongBits(
                    message.incomeTaskgifts.low >>> 0,
                    message.incomeTaskgifts.high >>> 0,
                  ).toNumber(true)
                : message.incomeTaskgifts;
      if (message.roomFanTicketCount != null && message.hasOwnProperty("roomFanTicketCount"))
        if (typeof message.roomFanTicketCount === "number")
          object.roomFanTicketCount =
            options.longs === String
              ? String(message.roomFanTicketCount)
              : message.roomFanTicketCount;
        else
          object.roomFanTicketCount =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.roomFanTicketCount)
              : options.longs === Number
                ? new $util.LongBits(
                    message.roomFanTicketCount.low >>> 0,
                    message.roomFanTicketCount.high >>> 0,
                  ).toNumber(true)
                : message.roomFanTicketCount;
      if (message.priority != null && message.hasOwnProperty("priority"))
        object.priority = $root.douyin.GiftIMPriority.toObject(message.priority, options);
      if (message.gift != null && message.hasOwnProperty("gift"))
        object.gift = $root.douyin.GiftStruct.toObject(message.gift, options);
      if (message.logId != null && message.hasOwnProperty("logId")) object.logId = message.logId;
      if (message.sendType != null && message.hasOwnProperty("sendType"))
        if (typeof message.sendType === "number")
          object.sendType = options.longs === String ? String(message.sendType) : message.sendType;
        else
          object.sendType =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.sendType)
              : options.longs === Number
                ? new $util.LongBits(
                    message.sendType.low >>> 0,
                    message.sendType.high >>> 0,
                  ).toNumber(true)
                : message.sendType;
      if (message.publicAreaCommon != null && message.hasOwnProperty("publicAreaCommon"))
        object.publicAreaCommon = $root.douyin.PublicAreaCommon.toObject(
          message.publicAreaCommon,
          options,
        );
      if (message.trayDisplayText != null && message.hasOwnProperty("trayDisplayText"))
        object.trayDisplayText = $root.douyin.Text.toObject(message.trayDisplayText, options);
      if (message.bannedDisplayEffects != null && message.hasOwnProperty("bannedDisplayEffects"))
        if (typeof message.bannedDisplayEffects === "number")
          object.bannedDisplayEffects =
            options.longs === String
              ? String(message.bannedDisplayEffects)
              : message.bannedDisplayEffects;
        else
          object.bannedDisplayEffects =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.bannedDisplayEffects)
              : options.longs === Number
                ? new $util.LongBits(
                    message.bannedDisplayEffects.low >>> 0,
                    message.bannedDisplayEffects.high >>> 0,
                  ).toNumber(true)
                : message.bannedDisplayEffects;
      if (message.displayForSelf != null && message.hasOwnProperty("displayForSelf"))
        object.displayForSelf = message.displayForSelf;
      if (message.interactGiftInfo != null && message.hasOwnProperty("interactGiftInfo"))
        object.interactGiftInfo = message.interactGiftInfo;
      if (message.diyItemInfo != null && message.hasOwnProperty("diyItemInfo"))
        object.diyItemInfo = message.diyItemInfo;
      if (message.minAssetSetList && message.minAssetSetList.length) {
        object.minAssetSetList = [];
        for (let j = 0; j < message.minAssetSetList.length; ++j)
          if (typeof message.minAssetSetList[j] === "number")
            object.minAssetSetList[j] =
              options.longs === String
                ? String(message.minAssetSetList[j])
                : message.minAssetSetList[j];
          else
            object.minAssetSetList[j] =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.minAssetSetList[j])
                : options.longs === Number
                  ? new $util.LongBits(
                      message.minAssetSetList[j].low >>> 0,
                      message.minAssetSetList[j].high >>> 0,
                    ).toNumber(true)
                  : message.minAssetSetList[j];
      }
      if (message.totalCount != null && message.hasOwnProperty("totalCount"))
        if (typeof message.totalCount === "number")
          object.totalCount =
            options.longs === String ? String(message.totalCount) : message.totalCount;
        else
          object.totalCount =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.totalCount)
              : options.longs === Number
                ? new $util.LongBits(
                    message.totalCount.low >>> 0,
                    message.totalCount.high >>> 0,
                  ).toNumber(true)
                : message.totalCount;
      if (message.clientGiftSource != null && message.hasOwnProperty("clientGiftSource"))
        object.clientGiftSource = message.clientGiftSource;
      if (message.toUserIdsList && message.toUserIdsList.length) {
        object.toUserIdsList = [];
        for (let j = 0; j < message.toUserIdsList.length; ++j)
          if (typeof message.toUserIdsList[j] === "number")
            object.toUserIdsList[j] =
              options.longs === String
                ? String(message.toUserIdsList[j])
                : message.toUserIdsList[j];
          else
            object.toUserIdsList[j] =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.toUserIdsList[j])
                : options.longs === Number
                  ? new $util.LongBits(
                      message.toUserIdsList[j].low >>> 0,
                      message.toUserIdsList[j].high >>> 0,
                    ).toNumber(true)
                  : message.toUserIdsList[j];
      }
      if (message.sendTime != null && message.hasOwnProperty("sendTime"))
        if (typeof message.sendTime === "number")
          object.sendTime = options.longs === String ? String(message.sendTime) : message.sendTime;
        else
          object.sendTime =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.sendTime)
              : options.longs === Number
                ? new $util.LongBits(
                    message.sendTime.low >>> 0,
                    message.sendTime.high >>> 0,
                  ).toNumber(true)
                : message.sendTime;
      if (message.forceDisplayEffects != null && message.hasOwnProperty("forceDisplayEffects"))
        if (typeof message.forceDisplayEffects === "number")
          object.forceDisplayEffects =
            options.longs === String
              ? String(message.forceDisplayEffects)
              : message.forceDisplayEffects;
        else
          object.forceDisplayEffects =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.forceDisplayEffects)
              : options.longs === Number
                ? new $util.LongBits(
                    message.forceDisplayEffects.low >>> 0,
                    message.forceDisplayEffects.high >>> 0,
                  ).toNumber(true)
                : message.forceDisplayEffects;
      if (message.traceId != null && message.hasOwnProperty("traceId"))
        object.traceId = message.traceId;
      if (message.effectDisplayTs != null && message.hasOwnProperty("effectDisplayTs"))
        if (typeof message.effectDisplayTs === "number")
          object.effectDisplayTs =
            options.longs === String ? String(message.effectDisplayTs) : message.effectDisplayTs;
        else
          object.effectDisplayTs =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.effectDisplayTs)
              : options.longs === Number
                ? new $util.LongBits(
                    message.effectDisplayTs.low >>> 0,
                    message.effectDisplayTs.high >>> 0,
                  ).toNumber(true)
                : message.effectDisplayTs;
      return object;
    };

    /**
     * Converts this GiftMessage to JSON.
     * @function toJSON
     * @memberof douyin.GiftMessage
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    GiftMessage.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for GiftMessage
     * @function getTypeUrl
     * @memberof douyin.GiftMessage
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    GiftMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.GiftMessage";
    };

    return GiftMessage;
  })();

  douyin.GiftStruct = (function () {
    /**
     * Properties of a GiftStruct.
     * @memberof douyin
     * @interface IGiftStruct
     * @property {douyin.IImage|null} [image] GiftStruct image
     * @property {string|null} [describe] GiftStruct describe
     * @property {boolean|null} [notify] GiftStruct notify
     * @property {number|Long|null} [duration] GiftStruct duration
     * @property {number|Long|null} [id] GiftStruct id
     * @property {boolean|null} [forLinkmic] GiftStruct forLinkmic
     * @property {boolean|null} [doodle] GiftStruct doodle
     * @property {boolean|null} [forFansclub] GiftStruct forFansclub
     * @property {boolean|null} [combo] GiftStruct combo
     * @property {number|null} [type] GiftStruct type
     * @property {number|null} [diamondCount] GiftStruct diamondCount
     * @property {boolean|null} [isDisplayedOnPanel] GiftStruct isDisplayedOnPanel
     * @property {number|Long|null} [primaryEffectId] GiftStruct primaryEffectId
     * @property {douyin.IImage|null} [giftLabelIcon] GiftStruct giftLabelIcon
     * @property {string|null} [name] GiftStruct name
     * @property {string|null} [region] GiftStruct region
     * @property {string|null} [manual] GiftStruct manual
     * @property {boolean|null} [forCustom] GiftStruct forCustom
     * @property {douyin.IImage|null} [icon] GiftStruct icon
     * @property {number|null} [actionType] GiftStruct actionType
     */

    /**
     * Constructs a new GiftStruct.
     * @memberof douyin
     * @classdesc Represents a GiftStruct.
     * @implements IGiftStruct
     * @constructor
     * @param {douyin.IGiftStruct=} [properties] Properties to set
     */
    function GiftStruct(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * GiftStruct image.
     * @member {douyin.IImage|null|undefined} image
     * @memberof douyin.GiftStruct
     * @instance
     */
    GiftStruct.prototype.image = null;

    /**
     * GiftStruct describe.
     * @member {string} describe
     * @memberof douyin.GiftStruct
     * @instance
     */
    GiftStruct.prototype.describe = "";

    /**
     * GiftStruct notify.
     * @member {boolean} notify
     * @memberof douyin.GiftStruct
     * @instance
     */
    GiftStruct.prototype.notify = false;

    /**
     * GiftStruct duration.
     * @member {number|Long} duration
     * @memberof douyin.GiftStruct
     * @instance
     */
    GiftStruct.prototype.duration = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * GiftStruct id.
     * @member {number|Long} id
     * @memberof douyin.GiftStruct
     * @instance
     */
    GiftStruct.prototype.id = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * GiftStruct forLinkmic.
     * @member {boolean} forLinkmic
     * @memberof douyin.GiftStruct
     * @instance
     */
    GiftStruct.prototype.forLinkmic = false;

    /**
     * GiftStruct doodle.
     * @member {boolean} doodle
     * @memberof douyin.GiftStruct
     * @instance
     */
    GiftStruct.prototype.doodle = false;

    /**
     * GiftStruct forFansclub.
     * @member {boolean} forFansclub
     * @memberof douyin.GiftStruct
     * @instance
     */
    GiftStruct.prototype.forFansclub = false;

    /**
     * GiftStruct combo.
     * @member {boolean} combo
     * @memberof douyin.GiftStruct
     * @instance
     */
    GiftStruct.prototype.combo = false;

    /**
     * GiftStruct type.
     * @member {number} type
     * @memberof douyin.GiftStruct
     * @instance
     */
    GiftStruct.prototype.type = 0;

    /**
     * GiftStruct diamondCount.
     * @member {number} diamondCount
     * @memberof douyin.GiftStruct
     * @instance
     */
    GiftStruct.prototype.diamondCount = 0;

    /**
     * GiftStruct isDisplayedOnPanel.
     * @member {boolean} isDisplayedOnPanel
     * @memberof douyin.GiftStruct
     * @instance
     */
    GiftStruct.prototype.isDisplayedOnPanel = false;

    /**
     * GiftStruct primaryEffectId.
     * @member {number|Long} primaryEffectId
     * @memberof douyin.GiftStruct
     * @instance
     */
    GiftStruct.prototype.primaryEffectId = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * GiftStruct giftLabelIcon.
     * @member {douyin.IImage|null|undefined} giftLabelIcon
     * @memberof douyin.GiftStruct
     * @instance
     */
    GiftStruct.prototype.giftLabelIcon = null;

    /**
     * GiftStruct name.
     * @member {string} name
     * @memberof douyin.GiftStruct
     * @instance
     */
    GiftStruct.prototype.name = "";

    /**
     * GiftStruct region.
     * @member {string} region
     * @memberof douyin.GiftStruct
     * @instance
     */
    GiftStruct.prototype.region = "";

    /**
     * GiftStruct manual.
     * @member {string} manual
     * @memberof douyin.GiftStruct
     * @instance
     */
    GiftStruct.prototype.manual = "";

    /**
     * GiftStruct forCustom.
     * @member {boolean} forCustom
     * @memberof douyin.GiftStruct
     * @instance
     */
    GiftStruct.prototype.forCustom = false;

    /**
     * GiftStruct icon.
     * @member {douyin.IImage|null|undefined} icon
     * @memberof douyin.GiftStruct
     * @instance
     */
    GiftStruct.prototype.icon = null;

    /**
     * GiftStruct actionType.
     * @member {number} actionType
     * @memberof douyin.GiftStruct
     * @instance
     */
    GiftStruct.prototype.actionType = 0;

    /**
     * Creates a new GiftStruct instance using the specified properties.
     * @function create
     * @memberof douyin.GiftStruct
     * @static
     * @param {douyin.IGiftStruct=} [properties] Properties to set
     * @returns {douyin.GiftStruct} GiftStruct instance
     */
    GiftStruct.create = function create(properties) {
      return new GiftStruct(properties);
    };

    /**
     * Encodes the specified GiftStruct message. Does not implicitly {@link douyin.GiftStruct.verify|verify} messages.
     * @function encode
     * @memberof douyin.GiftStruct
     * @static
     * @param {douyin.IGiftStruct} message GiftStruct message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GiftStruct.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.image != null && Object.hasOwnProperty.call(message, "image"))
        $root.douyin.Image.encode(
          message.image,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (message.describe != null && Object.hasOwnProperty.call(message, "describe"))
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.describe);
      if (message.notify != null && Object.hasOwnProperty.call(message, "notify"))
        writer.uint32(/* id 3, wireType 0 =*/ 24).bool(message.notify);
      if (message.duration != null && Object.hasOwnProperty.call(message, "duration"))
        writer.uint32(/* id 4, wireType 0 =*/ 32).uint64(message.duration);
      if (message.id != null && Object.hasOwnProperty.call(message, "id"))
        writer.uint32(/* id 5, wireType 0 =*/ 40).uint64(message.id);
      if (message.forLinkmic != null && Object.hasOwnProperty.call(message, "forLinkmic"))
        writer.uint32(/* id 7, wireType 0 =*/ 56).bool(message.forLinkmic);
      if (message.doodle != null && Object.hasOwnProperty.call(message, "doodle"))
        writer.uint32(/* id 8, wireType 0 =*/ 64).bool(message.doodle);
      if (message.forFansclub != null && Object.hasOwnProperty.call(message, "forFansclub"))
        writer.uint32(/* id 9, wireType 0 =*/ 72).bool(message.forFansclub);
      if (message.combo != null && Object.hasOwnProperty.call(message, "combo"))
        writer.uint32(/* id 10, wireType 0 =*/ 80).bool(message.combo);
      if (message.type != null && Object.hasOwnProperty.call(message, "type"))
        writer.uint32(/* id 11, wireType 0 =*/ 88).uint32(message.type);
      if (message.diamondCount != null && Object.hasOwnProperty.call(message, "diamondCount"))
        writer.uint32(/* id 12, wireType 0 =*/ 96).uint32(message.diamondCount);
      if (
        message.isDisplayedOnPanel != null &&
        Object.hasOwnProperty.call(message, "isDisplayedOnPanel")
      )
        writer.uint32(/* id 13, wireType 0 =*/ 104).bool(message.isDisplayedOnPanel);
      if (message.primaryEffectId != null && Object.hasOwnProperty.call(message, "primaryEffectId"))
        writer.uint32(/* id 14, wireType 0 =*/ 112).uint64(message.primaryEffectId);
      if (message.giftLabelIcon != null && Object.hasOwnProperty.call(message, "giftLabelIcon"))
        $root.douyin.Image.encode(
          message.giftLabelIcon,
          writer.uint32(/* id 15, wireType 2 =*/ 122).fork(),
        ).ldelim();
      if (message.name != null && Object.hasOwnProperty.call(message, "name"))
        writer.uint32(/* id 16, wireType 2 =*/ 130).string(message.name);
      if (message.region != null && Object.hasOwnProperty.call(message, "region"))
        writer.uint32(/* id 17, wireType 2 =*/ 138).string(message.region);
      if (message.manual != null && Object.hasOwnProperty.call(message, "manual"))
        writer.uint32(/* id 18, wireType 2 =*/ 146).string(message.manual);
      if (message.forCustom != null && Object.hasOwnProperty.call(message, "forCustom"))
        writer.uint32(/* id 19, wireType 0 =*/ 152).bool(message.forCustom);
      if (message.icon != null && Object.hasOwnProperty.call(message, "icon"))
        $root.douyin.Image.encode(
          message.icon,
          writer.uint32(/* id 21, wireType 2 =*/ 170).fork(),
        ).ldelim();
      if (message.actionType != null && Object.hasOwnProperty.call(message, "actionType"))
        writer.uint32(/* id 22, wireType 0 =*/ 176).uint32(message.actionType);
      return writer;
    };

    /**
     * Encodes the specified GiftStruct message, length delimited. Does not implicitly {@link douyin.GiftStruct.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.GiftStruct
     * @static
     * @param {douyin.IGiftStruct} message GiftStruct message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GiftStruct.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a GiftStruct message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.GiftStruct
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.GiftStruct} GiftStruct
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GiftStruct.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.GiftStruct();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.image = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 2: {
            message.describe = reader.string();
            break;
          }
          case 3: {
            message.notify = reader.bool();
            break;
          }
          case 4: {
            message.duration = reader.uint64();
            break;
          }
          case 5: {
            message.id = reader.uint64();
            break;
          }
          case 7: {
            message.forLinkmic = reader.bool();
            break;
          }
          case 8: {
            message.doodle = reader.bool();
            break;
          }
          case 9: {
            message.forFansclub = reader.bool();
            break;
          }
          case 10: {
            message.combo = reader.bool();
            break;
          }
          case 11: {
            message.type = reader.uint32();
            break;
          }
          case 12: {
            message.diamondCount = reader.uint32();
            break;
          }
          case 13: {
            message.isDisplayedOnPanel = reader.bool();
            break;
          }
          case 14: {
            message.primaryEffectId = reader.uint64();
            break;
          }
          case 15: {
            message.giftLabelIcon = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 16: {
            message.name = reader.string();
            break;
          }
          case 17: {
            message.region = reader.string();
            break;
          }
          case 18: {
            message.manual = reader.string();
            break;
          }
          case 19: {
            message.forCustom = reader.bool();
            break;
          }
          case 21: {
            message.icon = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 22: {
            message.actionType = reader.uint32();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a GiftStruct message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.GiftStruct
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.GiftStruct} GiftStruct
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GiftStruct.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a GiftStruct message.
     * @function verify
     * @memberof douyin.GiftStruct
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    GiftStruct.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.image != null && message.hasOwnProperty("image")) {
        let error = $root.douyin.Image.verify(message.image);
        if (error) return "image." + error;
      }
      if (message.describe != null && message.hasOwnProperty("describe"))
        if (!$util.isString(message.describe)) return "describe: string expected";
      if (message.notify != null && message.hasOwnProperty("notify"))
        if (typeof message.notify !== "boolean") return "notify: boolean expected";
      if (message.duration != null && message.hasOwnProperty("duration"))
        if (
          !$util.isInteger(message.duration) &&
          !(
            message.duration &&
            $util.isInteger(message.duration.low) &&
            $util.isInteger(message.duration.high)
          )
        )
          return "duration: integer|Long expected";
      if (message.id != null && message.hasOwnProperty("id"))
        if (
          !$util.isInteger(message.id) &&
          !(message.id && $util.isInteger(message.id.low) && $util.isInteger(message.id.high))
        )
          return "id: integer|Long expected";
      if (message.forLinkmic != null && message.hasOwnProperty("forLinkmic"))
        if (typeof message.forLinkmic !== "boolean") return "forLinkmic: boolean expected";
      if (message.doodle != null && message.hasOwnProperty("doodle"))
        if (typeof message.doodle !== "boolean") return "doodle: boolean expected";
      if (message.forFansclub != null && message.hasOwnProperty("forFansclub"))
        if (typeof message.forFansclub !== "boolean") return "forFansclub: boolean expected";
      if (message.combo != null && message.hasOwnProperty("combo"))
        if (typeof message.combo !== "boolean") return "combo: boolean expected";
      if (message.type != null && message.hasOwnProperty("type"))
        if (!$util.isInteger(message.type)) return "type: integer expected";
      if (message.diamondCount != null && message.hasOwnProperty("diamondCount"))
        if (!$util.isInteger(message.diamondCount)) return "diamondCount: integer expected";
      if (message.isDisplayedOnPanel != null && message.hasOwnProperty("isDisplayedOnPanel"))
        if (typeof message.isDisplayedOnPanel !== "boolean")
          return "isDisplayedOnPanel: boolean expected";
      if (message.primaryEffectId != null && message.hasOwnProperty("primaryEffectId"))
        if (
          !$util.isInteger(message.primaryEffectId) &&
          !(
            message.primaryEffectId &&
            $util.isInteger(message.primaryEffectId.low) &&
            $util.isInteger(message.primaryEffectId.high)
          )
        )
          return "primaryEffectId: integer|Long expected";
      if (message.giftLabelIcon != null && message.hasOwnProperty("giftLabelIcon")) {
        let error = $root.douyin.Image.verify(message.giftLabelIcon);
        if (error) return "giftLabelIcon." + error;
      }
      if (message.name != null && message.hasOwnProperty("name"))
        if (!$util.isString(message.name)) return "name: string expected";
      if (message.region != null && message.hasOwnProperty("region"))
        if (!$util.isString(message.region)) return "region: string expected";
      if (message.manual != null && message.hasOwnProperty("manual"))
        if (!$util.isString(message.manual)) return "manual: string expected";
      if (message.forCustom != null && message.hasOwnProperty("forCustom"))
        if (typeof message.forCustom !== "boolean") return "forCustom: boolean expected";
      if (message.icon != null && message.hasOwnProperty("icon")) {
        let error = $root.douyin.Image.verify(message.icon);
        if (error) return "icon." + error;
      }
      if (message.actionType != null && message.hasOwnProperty("actionType"))
        if (!$util.isInteger(message.actionType)) return "actionType: integer expected";
      return null;
    };

    /**
     * Creates a GiftStruct message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.GiftStruct
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.GiftStruct} GiftStruct
     */
    GiftStruct.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.GiftStruct) return object;
      let message = new $root.douyin.GiftStruct();
      if (object.image != null) {
        if (typeof object.image !== "object")
          throw TypeError(".douyin.GiftStruct.image: object expected");
        message.image = $root.douyin.Image.fromObject(object.image);
      }
      if (object.describe != null) message.describe = String(object.describe);
      if (object.notify != null) message.notify = Boolean(object.notify);
      if (object.duration != null)
        if ($util.Long) (message.duration = $util.Long.fromValue(object.duration)).unsigned = true;
        else if (typeof object.duration === "string")
          message.duration = parseInt(object.duration, 10);
        else if (typeof object.duration === "number") message.duration = object.duration;
        else if (typeof object.duration === "object")
          message.duration = new $util.LongBits(
            object.duration.low >>> 0,
            object.duration.high >>> 0,
          ).toNumber(true);
      if (object.id != null)
        if ($util.Long) (message.id = $util.Long.fromValue(object.id)).unsigned = true;
        else if (typeof object.id === "string") message.id = parseInt(object.id, 10);
        else if (typeof object.id === "number") message.id = object.id;
        else if (typeof object.id === "object")
          message.id = new $util.LongBits(object.id.low >>> 0, object.id.high >>> 0).toNumber(true);
      if (object.forLinkmic != null) message.forLinkmic = Boolean(object.forLinkmic);
      if (object.doodle != null) message.doodle = Boolean(object.doodle);
      if (object.forFansclub != null) message.forFansclub = Boolean(object.forFansclub);
      if (object.combo != null) message.combo = Boolean(object.combo);
      if (object.type != null) message.type = object.type >>> 0;
      if (object.diamondCount != null) message.diamondCount = object.diamondCount >>> 0;
      if (object.isDisplayedOnPanel != null)
        message.isDisplayedOnPanel = Boolean(object.isDisplayedOnPanel);
      if (object.primaryEffectId != null)
        if ($util.Long)
          (message.primaryEffectId = $util.Long.fromValue(object.primaryEffectId)).unsigned = true;
        else if (typeof object.primaryEffectId === "string")
          message.primaryEffectId = parseInt(object.primaryEffectId, 10);
        else if (typeof object.primaryEffectId === "number")
          message.primaryEffectId = object.primaryEffectId;
        else if (typeof object.primaryEffectId === "object")
          message.primaryEffectId = new $util.LongBits(
            object.primaryEffectId.low >>> 0,
            object.primaryEffectId.high >>> 0,
          ).toNumber(true);
      if (object.giftLabelIcon != null) {
        if (typeof object.giftLabelIcon !== "object")
          throw TypeError(".douyin.GiftStruct.giftLabelIcon: object expected");
        message.giftLabelIcon = $root.douyin.Image.fromObject(object.giftLabelIcon);
      }
      if (object.name != null) message.name = String(object.name);
      if (object.region != null) message.region = String(object.region);
      if (object.manual != null) message.manual = String(object.manual);
      if (object.forCustom != null) message.forCustom = Boolean(object.forCustom);
      if (object.icon != null) {
        if (typeof object.icon !== "object")
          throw TypeError(".douyin.GiftStruct.icon: object expected");
        message.icon = $root.douyin.Image.fromObject(object.icon);
      }
      if (object.actionType != null) message.actionType = object.actionType >>> 0;
      return message;
    };

    /**
     * Creates a plain object from a GiftStruct message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.GiftStruct
     * @static
     * @param {douyin.GiftStruct} message GiftStruct
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    GiftStruct.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.image = null;
        object.describe = "";
        object.notify = false;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.duration =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.duration = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.id =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.id = options.longs === String ? "0" : 0;
        object.forLinkmic = false;
        object.doodle = false;
        object.forFansclub = false;
        object.combo = false;
        object.type = 0;
        object.diamondCount = 0;
        object.isDisplayedOnPanel = false;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.primaryEffectId =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.primaryEffectId = options.longs === String ? "0" : 0;
        object.giftLabelIcon = null;
        object.name = "";
        object.region = "";
        object.manual = "";
        object.forCustom = false;
        object.icon = null;
        object.actionType = 0;
      }
      if (message.image != null && message.hasOwnProperty("image"))
        object.image = $root.douyin.Image.toObject(message.image, options);
      if (message.describe != null && message.hasOwnProperty("describe"))
        object.describe = message.describe;
      if (message.notify != null && message.hasOwnProperty("notify"))
        object.notify = message.notify;
      if (message.duration != null && message.hasOwnProperty("duration"))
        if (typeof message.duration === "number")
          object.duration = options.longs === String ? String(message.duration) : message.duration;
        else
          object.duration =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.duration)
              : options.longs === Number
                ? new $util.LongBits(
                    message.duration.low >>> 0,
                    message.duration.high >>> 0,
                  ).toNumber(true)
                : message.duration;
      if (message.id != null && message.hasOwnProperty("id"))
        if (typeof message.id === "number")
          object.id = options.longs === String ? String(message.id) : message.id;
        else
          object.id =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.id)
              : options.longs === Number
                ? new $util.LongBits(message.id.low >>> 0, message.id.high >>> 0).toNumber(true)
                : message.id;
      if (message.forLinkmic != null && message.hasOwnProperty("forLinkmic"))
        object.forLinkmic = message.forLinkmic;
      if (message.doodle != null && message.hasOwnProperty("doodle"))
        object.doodle = message.doodle;
      if (message.forFansclub != null && message.hasOwnProperty("forFansclub"))
        object.forFansclub = message.forFansclub;
      if (message.combo != null && message.hasOwnProperty("combo")) object.combo = message.combo;
      if (message.type != null && message.hasOwnProperty("type")) object.type = message.type;
      if (message.diamondCount != null && message.hasOwnProperty("diamondCount"))
        object.diamondCount = message.diamondCount;
      if (message.isDisplayedOnPanel != null && message.hasOwnProperty("isDisplayedOnPanel"))
        object.isDisplayedOnPanel = message.isDisplayedOnPanel;
      if (message.primaryEffectId != null && message.hasOwnProperty("primaryEffectId"))
        if (typeof message.primaryEffectId === "number")
          object.primaryEffectId =
            options.longs === String ? String(message.primaryEffectId) : message.primaryEffectId;
        else
          object.primaryEffectId =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.primaryEffectId)
              : options.longs === Number
                ? new $util.LongBits(
                    message.primaryEffectId.low >>> 0,
                    message.primaryEffectId.high >>> 0,
                  ).toNumber(true)
                : message.primaryEffectId;
      if (message.giftLabelIcon != null && message.hasOwnProperty("giftLabelIcon"))
        object.giftLabelIcon = $root.douyin.Image.toObject(message.giftLabelIcon, options);
      if (message.name != null && message.hasOwnProperty("name")) object.name = message.name;
      if (message.region != null && message.hasOwnProperty("region"))
        object.region = message.region;
      if (message.manual != null && message.hasOwnProperty("manual"))
        object.manual = message.manual;
      if (message.forCustom != null && message.hasOwnProperty("forCustom"))
        object.forCustom = message.forCustom;
      if (message.icon != null && message.hasOwnProperty("icon"))
        object.icon = $root.douyin.Image.toObject(message.icon, options);
      if (message.actionType != null && message.hasOwnProperty("actionType"))
        object.actionType = message.actionType;
      return object;
    };

    /**
     * Converts this GiftStruct to JSON.
     * @function toJSON
     * @memberof douyin.GiftStruct
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    GiftStruct.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for GiftStruct
     * @function getTypeUrl
     * @memberof douyin.GiftStruct
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    GiftStruct.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.GiftStruct";
    };

    return GiftStruct;
  })();

  douyin.GiftIMPriority = (function () {
    /**
     * Properties of a GiftIMPriority.
     * @memberof douyin
     * @interface IGiftIMPriority
     * @property {Array.<number|Long>|null} [queueSizesList] GiftIMPriority queueSizesList
     * @property {number|Long|null} [selfQueuePriority] GiftIMPriority selfQueuePriority
     * @property {number|Long|null} [priority] GiftIMPriority priority
     */

    /**
     * Constructs a new GiftIMPriority.
     * @memberof douyin
     * @classdesc Represents a GiftIMPriority.
     * @implements IGiftIMPriority
     * @constructor
     * @param {douyin.IGiftIMPriority=} [properties] Properties to set
     */
    function GiftIMPriority(properties) {
      this.queueSizesList = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * GiftIMPriority queueSizesList.
     * @member {Array.<number|Long>} queueSizesList
     * @memberof douyin.GiftIMPriority
     * @instance
     */
    GiftIMPriority.prototype.queueSizesList = $util.emptyArray;

    /**
     * GiftIMPriority selfQueuePriority.
     * @member {number|Long} selfQueuePriority
     * @memberof douyin.GiftIMPriority
     * @instance
     */
    GiftIMPriority.prototype.selfQueuePriority = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * GiftIMPriority priority.
     * @member {number|Long} priority
     * @memberof douyin.GiftIMPriority
     * @instance
     */
    GiftIMPriority.prototype.priority = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Creates a new GiftIMPriority instance using the specified properties.
     * @function create
     * @memberof douyin.GiftIMPriority
     * @static
     * @param {douyin.IGiftIMPriority=} [properties] Properties to set
     * @returns {douyin.GiftIMPriority} GiftIMPriority instance
     */
    GiftIMPriority.create = function create(properties) {
      return new GiftIMPriority(properties);
    };

    /**
     * Encodes the specified GiftIMPriority message. Does not implicitly {@link douyin.GiftIMPriority.verify|verify} messages.
     * @function encode
     * @memberof douyin.GiftIMPriority
     * @static
     * @param {douyin.IGiftIMPriority} message GiftIMPriority message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GiftIMPriority.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.queueSizesList != null && message.queueSizesList.length) {
        writer.uint32(/* id 1, wireType 2 =*/ 10).fork();
        for (let i = 0; i < message.queueSizesList.length; ++i)
          writer.uint64(message.queueSizesList[i]);
        writer.ldelim();
      }
      if (
        message.selfQueuePriority != null &&
        Object.hasOwnProperty.call(message, "selfQueuePriority")
      )
        writer.uint32(/* id 2, wireType 0 =*/ 16).uint64(message.selfQueuePriority);
      if (message.priority != null && Object.hasOwnProperty.call(message, "priority"))
        writer.uint32(/* id 3, wireType 0 =*/ 24).uint64(message.priority);
      return writer;
    };

    /**
     * Encodes the specified GiftIMPriority message, length delimited. Does not implicitly {@link douyin.GiftIMPriority.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.GiftIMPriority
     * @static
     * @param {douyin.IGiftIMPriority} message GiftIMPriority message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GiftIMPriority.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a GiftIMPriority message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.GiftIMPriority
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.GiftIMPriority} GiftIMPriority
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GiftIMPriority.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.GiftIMPriority();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            if (!(message.queueSizesList && message.queueSizesList.length))
              message.queueSizesList = [];
            if ((tag & 7) === 2) {
              let end2 = reader.uint32() + reader.pos;
              while (reader.pos < end2) message.queueSizesList.push(reader.uint64());
            } else message.queueSizesList.push(reader.uint64());
            break;
          }
          case 2: {
            message.selfQueuePriority = reader.uint64();
            break;
          }
          case 3: {
            message.priority = reader.uint64();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a GiftIMPriority message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.GiftIMPriority
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.GiftIMPriority} GiftIMPriority
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GiftIMPriority.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a GiftIMPriority message.
     * @function verify
     * @memberof douyin.GiftIMPriority
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    GiftIMPriority.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.queueSizesList != null && message.hasOwnProperty("queueSizesList")) {
        if (!Array.isArray(message.queueSizesList)) return "queueSizesList: array expected";
        for (let i = 0; i < message.queueSizesList.length; ++i)
          if (
            !$util.isInteger(message.queueSizesList[i]) &&
            !(
              message.queueSizesList[i] &&
              $util.isInteger(message.queueSizesList[i].low) &&
              $util.isInteger(message.queueSizesList[i].high)
            )
          )
            return "queueSizesList: integer|Long[] expected";
      }
      if (message.selfQueuePriority != null && message.hasOwnProperty("selfQueuePriority"))
        if (
          !$util.isInteger(message.selfQueuePriority) &&
          !(
            message.selfQueuePriority &&
            $util.isInteger(message.selfQueuePriority.low) &&
            $util.isInteger(message.selfQueuePriority.high)
          )
        )
          return "selfQueuePriority: integer|Long expected";
      if (message.priority != null && message.hasOwnProperty("priority"))
        if (
          !$util.isInteger(message.priority) &&
          !(
            message.priority &&
            $util.isInteger(message.priority.low) &&
            $util.isInteger(message.priority.high)
          )
        )
          return "priority: integer|Long expected";
      return null;
    };

    /**
     * Creates a GiftIMPriority message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.GiftIMPriority
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.GiftIMPriority} GiftIMPriority
     */
    GiftIMPriority.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.GiftIMPriority) return object;
      let message = new $root.douyin.GiftIMPriority();
      if (object.queueSizesList) {
        if (!Array.isArray(object.queueSizesList))
          throw TypeError(".douyin.GiftIMPriority.queueSizesList: array expected");
        message.queueSizesList = [];
        for (let i = 0; i < object.queueSizesList.length; ++i)
          if ($util.Long)
            (message.queueSizesList[i] = $util.Long.fromValue(object.queueSizesList[i])).unsigned =
              true;
          else if (typeof object.queueSizesList[i] === "string")
            message.queueSizesList[i] = parseInt(object.queueSizesList[i], 10);
          else if (typeof object.queueSizesList[i] === "number")
            message.queueSizesList[i] = object.queueSizesList[i];
          else if (typeof object.queueSizesList[i] === "object")
            message.queueSizesList[i] = new $util.LongBits(
              object.queueSizesList[i].low >>> 0,
              object.queueSizesList[i].high >>> 0,
            ).toNumber(true);
      }
      if (object.selfQueuePriority != null)
        if ($util.Long)
          (message.selfQueuePriority = $util.Long.fromValue(object.selfQueuePriority)).unsigned =
            true;
        else if (typeof object.selfQueuePriority === "string")
          message.selfQueuePriority = parseInt(object.selfQueuePriority, 10);
        else if (typeof object.selfQueuePriority === "number")
          message.selfQueuePriority = object.selfQueuePriority;
        else if (typeof object.selfQueuePriority === "object")
          message.selfQueuePriority = new $util.LongBits(
            object.selfQueuePriority.low >>> 0,
            object.selfQueuePriority.high >>> 0,
          ).toNumber(true);
      if (object.priority != null)
        if ($util.Long) (message.priority = $util.Long.fromValue(object.priority)).unsigned = true;
        else if (typeof object.priority === "string")
          message.priority = parseInt(object.priority, 10);
        else if (typeof object.priority === "number") message.priority = object.priority;
        else if (typeof object.priority === "object")
          message.priority = new $util.LongBits(
            object.priority.low >>> 0,
            object.priority.high >>> 0,
          ).toNumber(true);
      return message;
    };

    /**
     * Creates a plain object from a GiftIMPriority message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.GiftIMPriority
     * @static
     * @param {douyin.GiftIMPriority} message GiftIMPriority
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    GiftIMPriority.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.queueSizesList = [];
      if (options.defaults) {
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.selfQueuePriority =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.selfQueuePriority = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.priority =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.priority = options.longs === String ? "0" : 0;
      }
      if (message.queueSizesList && message.queueSizesList.length) {
        object.queueSizesList = [];
        for (let j = 0; j < message.queueSizesList.length; ++j)
          if (typeof message.queueSizesList[j] === "number")
            object.queueSizesList[j] =
              options.longs === String
                ? String(message.queueSizesList[j])
                : message.queueSizesList[j];
          else
            object.queueSizesList[j] =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.queueSizesList[j])
                : options.longs === Number
                  ? new $util.LongBits(
                      message.queueSizesList[j].low >>> 0,
                      message.queueSizesList[j].high >>> 0,
                    ).toNumber(true)
                  : message.queueSizesList[j];
      }
      if (message.selfQueuePriority != null && message.hasOwnProperty("selfQueuePriority"))
        if (typeof message.selfQueuePriority === "number")
          object.selfQueuePriority =
            options.longs === String
              ? String(message.selfQueuePriority)
              : message.selfQueuePriority;
        else
          object.selfQueuePriority =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.selfQueuePriority)
              : options.longs === Number
                ? new $util.LongBits(
                    message.selfQueuePriority.low >>> 0,
                    message.selfQueuePriority.high >>> 0,
                  ).toNumber(true)
                : message.selfQueuePriority;
      if (message.priority != null && message.hasOwnProperty("priority"))
        if (typeof message.priority === "number")
          object.priority = options.longs === String ? String(message.priority) : message.priority;
        else
          object.priority =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.priority)
              : options.longs === Number
                ? new $util.LongBits(
                    message.priority.low >>> 0,
                    message.priority.high >>> 0,
                  ).toNumber(true)
                : message.priority;
      return object;
    };

    /**
     * Converts this GiftIMPriority to JSON.
     * @function toJSON
     * @memberof douyin.GiftIMPriority
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    GiftIMPriority.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for GiftIMPriority
     * @function getTypeUrl
     * @memberof douyin.GiftIMPriority
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    GiftIMPriority.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.GiftIMPriority";
    };

    return GiftIMPriority;
  })();

  douyin.TextEffect = (function () {
    /**
     * Properties of a TextEffect.
     * @memberof douyin
     * @interface ITextEffect
     * @property {douyin.ITextEffectDetail|null} [portrait] TextEffect portrait
     * @property {douyin.ITextEffectDetail|null} [landscape] TextEffect landscape
     */

    /**
     * Constructs a new TextEffect.
     * @memberof douyin
     * @classdesc Represents a TextEffect.
     * @implements ITextEffect
     * @constructor
     * @param {douyin.ITextEffect=} [properties] Properties to set
     */
    function TextEffect(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * TextEffect portrait.
     * @member {douyin.ITextEffectDetail|null|undefined} portrait
     * @memberof douyin.TextEffect
     * @instance
     */
    TextEffect.prototype.portrait = null;

    /**
     * TextEffect landscape.
     * @member {douyin.ITextEffectDetail|null|undefined} landscape
     * @memberof douyin.TextEffect
     * @instance
     */
    TextEffect.prototype.landscape = null;

    /**
     * Creates a new TextEffect instance using the specified properties.
     * @function create
     * @memberof douyin.TextEffect
     * @static
     * @param {douyin.ITextEffect=} [properties] Properties to set
     * @returns {douyin.TextEffect} TextEffect instance
     */
    TextEffect.create = function create(properties) {
      return new TextEffect(properties);
    };

    /**
     * Encodes the specified TextEffect message. Does not implicitly {@link douyin.TextEffect.verify|verify} messages.
     * @function encode
     * @memberof douyin.TextEffect
     * @static
     * @param {douyin.ITextEffect} message TextEffect message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TextEffect.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.portrait != null && Object.hasOwnProperty.call(message, "portrait"))
        $root.douyin.TextEffectDetail.encode(
          message.portrait,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (message.landscape != null && Object.hasOwnProperty.call(message, "landscape"))
        $root.douyin.TextEffectDetail.encode(
          message.landscape,
          writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
        ).ldelim();
      return writer;
    };

    /**
     * Encodes the specified TextEffect message, length delimited. Does not implicitly {@link douyin.TextEffect.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.TextEffect
     * @static
     * @param {douyin.ITextEffect} message TextEffect message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TextEffect.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a TextEffect message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.TextEffect
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.TextEffect} TextEffect
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TextEffect.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.TextEffect();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.portrait = $root.douyin.TextEffectDetail.decode(reader, reader.uint32());
            break;
          }
          case 2: {
            message.landscape = $root.douyin.TextEffectDetail.decode(reader, reader.uint32());
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a TextEffect message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.TextEffect
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.TextEffect} TextEffect
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TextEffect.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a TextEffect message.
     * @function verify
     * @memberof douyin.TextEffect
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    TextEffect.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.portrait != null && message.hasOwnProperty("portrait")) {
        let error = $root.douyin.TextEffectDetail.verify(message.portrait);
        if (error) return "portrait." + error;
      }
      if (message.landscape != null && message.hasOwnProperty("landscape")) {
        let error = $root.douyin.TextEffectDetail.verify(message.landscape);
        if (error) return "landscape." + error;
      }
      return null;
    };

    /**
     * Creates a TextEffect message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.TextEffect
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.TextEffect} TextEffect
     */
    TextEffect.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.TextEffect) return object;
      let message = new $root.douyin.TextEffect();
      if (object.portrait != null) {
        if (typeof object.portrait !== "object")
          throw TypeError(".douyin.TextEffect.portrait: object expected");
        message.portrait = $root.douyin.TextEffectDetail.fromObject(object.portrait);
      }
      if (object.landscape != null) {
        if (typeof object.landscape !== "object")
          throw TypeError(".douyin.TextEffect.landscape: object expected");
        message.landscape = $root.douyin.TextEffectDetail.fromObject(object.landscape);
      }
      return message;
    };

    /**
     * Creates a plain object from a TextEffect message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.TextEffect
     * @static
     * @param {douyin.TextEffect} message TextEffect
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    TextEffect.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.portrait = null;
        object.landscape = null;
      }
      if (message.portrait != null && message.hasOwnProperty("portrait"))
        object.portrait = $root.douyin.TextEffectDetail.toObject(message.portrait, options);
      if (message.landscape != null && message.hasOwnProperty("landscape"))
        object.landscape = $root.douyin.TextEffectDetail.toObject(message.landscape, options);
      return object;
    };

    /**
     * Converts this TextEffect to JSON.
     * @function toJSON
     * @memberof douyin.TextEffect
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    TextEffect.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for TextEffect
     * @function getTypeUrl
     * @memberof douyin.TextEffect
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    TextEffect.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.TextEffect";
    };

    return TextEffect;
  })();

  douyin.TextEffectDetail = (function () {
    /**
     * Properties of a TextEffectDetail.
     * @memberof douyin
     * @interface ITextEffectDetail
     * @property {douyin.IText|null} [text] TextEffectDetail text
     * @property {number|null} [textFontSize] TextEffectDetail textFontSize
     * @property {douyin.IImage|null} [background] TextEffectDetail background
     * @property {number|null} [start] TextEffectDetail start
     * @property {number|null} [duration] TextEffectDetail duration
     * @property {number|null} [x] TextEffectDetail x
     * @property {number|null} [y] TextEffectDetail y
     * @property {number|null} [width] TextEffectDetail width
     * @property {number|null} [height] TextEffectDetail height
     * @property {number|null} [shadowDx] TextEffectDetail shadowDx
     * @property {number|null} [shadowDy] TextEffectDetail shadowDy
     * @property {number|null} [shadowRadius] TextEffectDetail shadowRadius
     * @property {string|null} [shadowColor] TextEffectDetail shadowColor
     * @property {string|null} [strokeColor] TextEffectDetail strokeColor
     * @property {number|null} [strokeWidth] TextEffectDetail strokeWidth
     */

    /**
     * Constructs a new TextEffectDetail.
     * @memberof douyin
     * @classdesc Represents a TextEffectDetail.
     * @implements ITextEffectDetail
     * @constructor
     * @param {douyin.ITextEffectDetail=} [properties] Properties to set
     */
    function TextEffectDetail(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * TextEffectDetail text.
     * @member {douyin.IText|null|undefined} text
     * @memberof douyin.TextEffectDetail
     * @instance
     */
    TextEffectDetail.prototype.text = null;

    /**
     * TextEffectDetail textFontSize.
     * @member {number} textFontSize
     * @memberof douyin.TextEffectDetail
     * @instance
     */
    TextEffectDetail.prototype.textFontSize = 0;

    /**
     * TextEffectDetail background.
     * @member {douyin.IImage|null|undefined} background
     * @memberof douyin.TextEffectDetail
     * @instance
     */
    TextEffectDetail.prototype.background = null;

    /**
     * TextEffectDetail start.
     * @member {number} start
     * @memberof douyin.TextEffectDetail
     * @instance
     */
    TextEffectDetail.prototype.start = 0;

    /**
     * TextEffectDetail duration.
     * @member {number} duration
     * @memberof douyin.TextEffectDetail
     * @instance
     */
    TextEffectDetail.prototype.duration = 0;

    /**
     * TextEffectDetail x.
     * @member {number} x
     * @memberof douyin.TextEffectDetail
     * @instance
     */
    TextEffectDetail.prototype.x = 0;

    /**
     * TextEffectDetail y.
     * @member {number} y
     * @memberof douyin.TextEffectDetail
     * @instance
     */
    TextEffectDetail.prototype.y = 0;

    /**
     * TextEffectDetail width.
     * @member {number} width
     * @memberof douyin.TextEffectDetail
     * @instance
     */
    TextEffectDetail.prototype.width = 0;

    /**
     * TextEffectDetail height.
     * @member {number} height
     * @memberof douyin.TextEffectDetail
     * @instance
     */
    TextEffectDetail.prototype.height = 0;

    /**
     * TextEffectDetail shadowDx.
     * @member {number} shadowDx
     * @memberof douyin.TextEffectDetail
     * @instance
     */
    TextEffectDetail.prototype.shadowDx = 0;

    /**
     * TextEffectDetail shadowDy.
     * @member {number} shadowDy
     * @memberof douyin.TextEffectDetail
     * @instance
     */
    TextEffectDetail.prototype.shadowDy = 0;

    /**
     * TextEffectDetail shadowRadius.
     * @member {number} shadowRadius
     * @memberof douyin.TextEffectDetail
     * @instance
     */
    TextEffectDetail.prototype.shadowRadius = 0;

    /**
     * TextEffectDetail shadowColor.
     * @member {string} shadowColor
     * @memberof douyin.TextEffectDetail
     * @instance
     */
    TextEffectDetail.prototype.shadowColor = "";

    /**
     * TextEffectDetail strokeColor.
     * @member {string} strokeColor
     * @memberof douyin.TextEffectDetail
     * @instance
     */
    TextEffectDetail.prototype.strokeColor = "";

    /**
     * TextEffectDetail strokeWidth.
     * @member {number} strokeWidth
     * @memberof douyin.TextEffectDetail
     * @instance
     */
    TextEffectDetail.prototype.strokeWidth = 0;

    /**
     * Creates a new TextEffectDetail instance using the specified properties.
     * @function create
     * @memberof douyin.TextEffectDetail
     * @static
     * @param {douyin.ITextEffectDetail=} [properties] Properties to set
     * @returns {douyin.TextEffectDetail} TextEffectDetail instance
     */
    TextEffectDetail.create = function create(properties) {
      return new TextEffectDetail(properties);
    };

    /**
     * Encodes the specified TextEffectDetail message. Does not implicitly {@link douyin.TextEffectDetail.verify|verify} messages.
     * @function encode
     * @memberof douyin.TextEffectDetail
     * @static
     * @param {douyin.ITextEffectDetail} message TextEffectDetail message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TextEffectDetail.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.text != null && Object.hasOwnProperty.call(message, "text"))
        $root.douyin.Text.encode(
          message.text,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (message.textFontSize != null && Object.hasOwnProperty.call(message, "textFontSize"))
        writer.uint32(/* id 2, wireType 0 =*/ 16).uint32(message.textFontSize);
      if (message.background != null && Object.hasOwnProperty.call(message, "background"))
        $root.douyin.Image.encode(
          message.background,
          writer.uint32(/* id 3, wireType 2 =*/ 26).fork(),
        ).ldelim();
      if (message.start != null && Object.hasOwnProperty.call(message, "start"))
        writer.uint32(/* id 4, wireType 0 =*/ 32).uint32(message.start);
      if (message.duration != null && Object.hasOwnProperty.call(message, "duration"))
        writer.uint32(/* id 5, wireType 0 =*/ 40).uint32(message.duration);
      if (message.x != null && Object.hasOwnProperty.call(message, "x"))
        writer.uint32(/* id 6, wireType 0 =*/ 48).uint32(message.x);
      if (message.y != null && Object.hasOwnProperty.call(message, "y"))
        writer.uint32(/* id 7, wireType 0 =*/ 56).uint32(message.y);
      if (message.width != null && Object.hasOwnProperty.call(message, "width"))
        writer.uint32(/* id 8, wireType 0 =*/ 64).uint32(message.width);
      if (message.height != null && Object.hasOwnProperty.call(message, "height"))
        writer.uint32(/* id 9, wireType 0 =*/ 72).uint32(message.height);
      if (message.shadowDx != null && Object.hasOwnProperty.call(message, "shadowDx"))
        writer.uint32(/* id 10, wireType 0 =*/ 80).uint32(message.shadowDx);
      if (message.shadowDy != null && Object.hasOwnProperty.call(message, "shadowDy"))
        writer.uint32(/* id 11, wireType 0 =*/ 88).uint32(message.shadowDy);
      if (message.shadowRadius != null && Object.hasOwnProperty.call(message, "shadowRadius"))
        writer.uint32(/* id 12, wireType 0 =*/ 96).uint32(message.shadowRadius);
      if (message.shadowColor != null && Object.hasOwnProperty.call(message, "shadowColor"))
        writer.uint32(/* id 13, wireType 2 =*/ 106).string(message.shadowColor);
      if (message.strokeColor != null && Object.hasOwnProperty.call(message, "strokeColor"))
        writer.uint32(/* id 14, wireType 2 =*/ 114).string(message.strokeColor);
      if (message.strokeWidth != null && Object.hasOwnProperty.call(message, "strokeWidth"))
        writer.uint32(/* id 15, wireType 0 =*/ 120).uint32(message.strokeWidth);
      return writer;
    };

    /**
     * Encodes the specified TextEffectDetail message, length delimited. Does not implicitly {@link douyin.TextEffectDetail.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.TextEffectDetail
     * @static
     * @param {douyin.ITextEffectDetail} message TextEffectDetail message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TextEffectDetail.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a TextEffectDetail message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.TextEffectDetail
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.TextEffectDetail} TextEffectDetail
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TextEffectDetail.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.TextEffectDetail();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.text = $root.douyin.Text.decode(reader, reader.uint32());
            break;
          }
          case 2: {
            message.textFontSize = reader.uint32();
            break;
          }
          case 3: {
            message.background = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 4: {
            message.start = reader.uint32();
            break;
          }
          case 5: {
            message.duration = reader.uint32();
            break;
          }
          case 6: {
            message.x = reader.uint32();
            break;
          }
          case 7: {
            message.y = reader.uint32();
            break;
          }
          case 8: {
            message.width = reader.uint32();
            break;
          }
          case 9: {
            message.height = reader.uint32();
            break;
          }
          case 10: {
            message.shadowDx = reader.uint32();
            break;
          }
          case 11: {
            message.shadowDy = reader.uint32();
            break;
          }
          case 12: {
            message.shadowRadius = reader.uint32();
            break;
          }
          case 13: {
            message.shadowColor = reader.string();
            break;
          }
          case 14: {
            message.strokeColor = reader.string();
            break;
          }
          case 15: {
            message.strokeWidth = reader.uint32();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a TextEffectDetail message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.TextEffectDetail
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.TextEffectDetail} TextEffectDetail
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TextEffectDetail.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a TextEffectDetail message.
     * @function verify
     * @memberof douyin.TextEffectDetail
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    TextEffectDetail.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.text != null && message.hasOwnProperty("text")) {
        let error = $root.douyin.Text.verify(message.text);
        if (error) return "text." + error;
      }
      if (message.textFontSize != null && message.hasOwnProperty("textFontSize"))
        if (!$util.isInteger(message.textFontSize)) return "textFontSize: integer expected";
      if (message.background != null && message.hasOwnProperty("background")) {
        let error = $root.douyin.Image.verify(message.background);
        if (error) return "background." + error;
      }
      if (message.start != null && message.hasOwnProperty("start"))
        if (!$util.isInteger(message.start)) return "start: integer expected";
      if (message.duration != null && message.hasOwnProperty("duration"))
        if (!$util.isInteger(message.duration)) return "duration: integer expected";
      if (message.x != null && message.hasOwnProperty("x"))
        if (!$util.isInteger(message.x)) return "x: integer expected";
      if (message.y != null && message.hasOwnProperty("y"))
        if (!$util.isInteger(message.y)) return "y: integer expected";
      if (message.width != null && message.hasOwnProperty("width"))
        if (!$util.isInteger(message.width)) return "width: integer expected";
      if (message.height != null && message.hasOwnProperty("height"))
        if (!$util.isInteger(message.height)) return "height: integer expected";
      if (message.shadowDx != null && message.hasOwnProperty("shadowDx"))
        if (!$util.isInteger(message.shadowDx)) return "shadowDx: integer expected";
      if (message.shadowDy != null && message.hasOwnProperty("shadowDy"))
        if (!$util.isInteger(message.shadowDy)) return "shadowDy: integer expected";
      if (message.shadowRadius != null && message.hasOwnProperty("shadowRadius"))
        if (!$util.isInteger(message.shadowRadius)) return "shadowRadius: integer expected";
      if (message.shadowColor != null && message.hasOwnProperty("shadowColor"))
        if (!$util.isString(message.shadowColor)) return "shadowColor: string expected";
      if (message.strokeColor != null && message.hasOwnProperty("strokeColor"))
        if (!$util.isString(message.strokeColor)) return "strokeColor: string expected";
      if (message.strokeWidth != null && message.hasOwnProperty("strokeWidth"))
        if (!$util.isInteger(message.strokeWidth)) return "strokeWidth: integer expected";
      return null;
    };

    /**
     * Creates a TextEffectDetail message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.TextEffectDetail
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.TextEffectDetail} TextEffectDetail
     */
    TextEffectDetail.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.TextEffectDetail) return object;
      let message = new $root.douyin.TextEffectDetail();
      if (object.text != null) {
        if (typeof object.text !== "object")
          throw TypeError(".douyin.TextEffectDetail.text: object expected");
        message.text = $root.douyin.Text.fromObject(object.text);
      }
      if (object.textFontSize != null) message.textFontSize = object.textFontSize >>> 0;
      if (object.background != null) {
        if (typeof object.background !== "object")
          throw TypeError(".douyin.TextEffectDetail.background: object expected");
        message.background = $root.douyin.Image.fromObject(object.background);
      }
      if (object.start != null) message.start = object.start >>> 0;
      if (object.duration != null) message.duration = object.duration >>> 0;
      if (object.x != null) message.x = object.x >>> 0;
      if (object.y != null) message.y = object.y >>> 0;
      if (object.width != null) message.width = object.width >>> 0;
      if (object.height != null) message.height = object.height >>> 0;
      if (object.shadowDx != null) message.shadowDx = object.shadowDx >>> 0;
      if (object.shadowDy != null) message.shadowDy = object.shadowDy >>> 0;
      if (object.shadowRadius != null) message.shadowRadius = object.shadowRadius >>> 0;
      if (object.shadowColor != null) message.shadowColor = String(object.shadowColor);
      if (object.strokeColor != null) message.strokeColor = String(object.strokeColor);
      if (object.strokeWidth != null) message.strokeWidth = object.strokeWidth >>> 0;
      return message;
    };

    /**
     * Creates a plain object from a TextEffectDetail message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.TextEffectDetail
     * @static
     * @param {douyin.TextEffectDetail} message TextEffectDetail
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    TextEffectDetail.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.text = null;
        object.textFontSize = 0;
        object.background = null;
        object.start = 0;
        object.duration = 0;
        object.x = 0;
        object.y = 0;
        object.width = 0;
        object.height = 0;
        object.shadowDx = 0;
        object.shadowDy = 0;
        object.shadowRadius = 0;
        object.shadowColor = "";
        object.strokeColor = "";
        object.strokeWidth = 0;
      }
      if (message.text != null && message.hasOwnProperty("text"))
        object.text = $root.douyin.Text.toObject(message.text, options);
      if (message.textFontSize != null && message.hasOwnProperty("textFontSize"))
        object.textFontSize = message.textFontSize;
      if (message.background != null && message.hasOwnProperty("background"))
        object.background = $root.douyin.Image.toObject(message.background, options);
      if (message.start != null && message.hasOwnProperty("start")) object.start = message.start;
      if (message.duration != null && message.hasOwnProperty("duration"))
        object.duration = message.duration;
      if (message.x != null && message.hasOwnProperty("x")) object.x = message.x;
      if (message.y != null && message.hasOwnProperty("y")) object.y = message.y;
      if (message.width != null && message.hasOwnProperty("width")) object.width = message.width;
      if (message.height != null && message.hasOwnProperty("height"))
        object.height = message.height;
      if (message.shadowDx != null && message.hasOwnProperty("shadowDx"))
        object.shadowDx = message.shadowDx;
      if (message.shadowDy != null && message.hasOwnProperty("shadowDy"))
        object.shadowDy = message.shadowDy;
      if (message.shadowRadius != null && message.hasOwnProperty("shadowRadius"))
        object.shadowRadius = message.shadowRadius;
      if (message.shadowColor != null && message.hasOwnProperty("shadowColor"))
        object.shadowColor = message.shadowColor;
      if (message.strokeColor != null && message.hasOwnProperty("strokeColor"))
        object.strokeColor = message.strokeColor;
      if (message.strokeWidth != null && message.hasOwnProperty("strokeWidth"))
        object.strokeWidth = message.strokeWidth;
      return object;
    };

    /**
     * Converts this TextEffectDetail to JSON.
     * @function toJSON
     * @memberof douyin.TextEffectDetail
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    TextEffectDetail.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for TextEffectDetail
     * @function getTypeUrl
     * @memberof douyin.TextEffectDetail
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    TextEffectDetail.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.TextEffectDetail";
    };

    return TextEffectDetail;
  })();

  douyin.MemberMessage = (function () {
    /**
     * Properties of a MemberMessage.
     * @memberof douyin
     * @interface IMemberMessage
     * @property {douyin.ICommon|null} [common] MemberMessage common
     * @property {douyin.IUser|null} [user] MemberMessage user
     * @property {number|Long|null} [memberCount] MemberMessage memberCount
     * @property {douyin.IUser|null} [operator] MemberMessage operator
     * @property {boolean|null} [isSetToAdmin] MemberMessage isSetToAdmin
     * @property {boolean|null} [isTopUser] MemberMessage isTopUser
     * @property {number|Long|null} [rankScore] MemberMessage rankScore
     * @property {number|Long|null} [topUserNo] MemberMessage topUserNo
     * @property {number|Long|null} [enterType] MemberMessage enterType
     * @property {number|Long|null} [action] MemberMessage action
     * @property {string|null} [actionDescription] MemberMessage actionDescription
     * @property {number|Long|null} [userId] MemberMessage userId
     * @property {douyin.IEffectConfig|null} [effectConfig] MemberMessage effectConfig
     * @property {string|null} [popStr] MemberMessage popStr
     * @property {douyin.IEffectConfig|null} [enterEffectConfig] MemberMessage enterEffectConfig
     * @property {douyin.IImage|null} [backgroundImage] MemberMessage backgroundImage
     * @property {douyin.IImage|null} [backgroundImageV2] MemberMessage backgroundImageV2
     * @property {douyin.IText|null} [anchorDisplayText] MemberMessage anchorDisplayText
     * @property {douyin.IPublicAreaCommon|null} [publicAreaCommon] MemberMessage publicAreaCommon
     * @property {number|Long|null} [userEnterTipType] MemberMessage userEnterTipType
     * @property {number|Long|null} [anchorEnterTipType] MemberMessage anchorEnterTipType
     */

    /**
     * Constructs a new MemberMessage.
     * @memberof douyin
     * @classdesc Represents a MemberMessage.
     * @implements IMemberMessage
     * @constructor
     * @param {douyin.IMemberMessage=} [properties] Properties to set
     */
    function MemberMessage(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * MemberMessage common.
     * @member {douyin.ICommon|null|undefined} common
     * @memberof douyin.MemberMessage
     * @instance
     */
    MemberMessage.prototype.common = null;

    /**
     * MemberMessage user.
     * @member {douyin.IUser|null|undefined} user
     * @memberof douyin.MemberMessage
     * @instance
     */
    MemberMessage.prototype.user = null;

    /**
     * MemberMessage memberCount.
     * @member {number|Long} memberCount
     * @memberof douyin.MemberMessage
     * @instance
     */
    MemberMessage.prototype.memberCount = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * MemberMessage operator.
     * @member {douyin.IUser|null|undefined} operator
     * @memberof douyin.MemberMessage
     * @instance
     */
    MemberMessage.prototype.operator = null;

    /**
     * MemberMessage isSetToAdmin.
     * @member {boolean} isSetToAdmin
     * @memberof douyin.MemberMessage
     * @instance
     */
    MemberMessage.prototype.isSetToAdmin = false;

    /**
     * MemberMessage isTopUser.
     * @member {boolean} isTopUser
     * @memberof douyin.MemberMessage
     * @instance
     */
    MemberMessage.prototype.isTopUser = false;

    /**
     * MemberMessage rankScore.
     * @member {number|Long} rankScore
     * @memberof douyin.MemberMessage
     * @instance
     */
    MemberMessage.prototype.rankScore = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * MemberMessage topUserNo.
     * @member {number|Long} topUserNo
     * @memberof douyin.MemberMessage
     * @instance
     */
    MemberMessage.prototype.topUserNo = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * MemberMessage enterType.
     * @member {number|Long} enterType
     * @memberof douyin.MemberMessage
     * @instance
     */
    MemberMessage.prototype.enterType = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * MemberMessage action.
     * @member {number|Long} action
     * @memberof douyin.MemberMessage
     * @instance
     */
    MemberMessage.prototype.action = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * MemberMessage actionDescription.
     * @member {string} actionDescription
     * @memberof douyin.MemberMessage
     * @instance
     */
    MemberMessage.prototype.actionDescription = "";

    /**
     * MemberMessage userId.
     * @member {number|Long} userId
     * @memberof douyin.MemberMessage
     * @instance
     */
    MemberMessage.prototype.userId = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * MemberMessage effectConfig.
     * @member {douyin.IEffectConfig|null|undefined} effectConfig
     * @memberof douyin.MemberMessage
     * @instance
     */
    MemberMessage.prototype.effectConfig = null;

    /**
     * MemberMessage popStr.
     * @member {string} popStr
     * @memberof douyin.MemberMessage
     * @instance
     */
    MemberMessage.prototype.popStr = "";

    /**
     * MemberMessage enterEffectConfig.
     * @member {douyin.IEffectConfig|null|undefined} enterEffectConfig
     * @memberof douyin.MemberMessage
     * @instance
     */
    MemberMessage.prototype.enterEffectConfig = null;

    /**
     * MemberMessage backgroundImage.
     * @member {douyin.IImage|null|undefined} backgroundImage
     * @memberof douyin.MemberMessage
     * @instance
     */
    MemberMessage.prototype.backgroundImage = null;

    /**
     * MemberMessage backgroundImageV2.
     * @member {douyin.IImage|null|undefined} backgroundImageV2
     * @memberof douyin.MemberMessage
     * @instance
     */
    MemberMessage.prototype.backgroundImageV2 = null;

    /**
     * MemberMessage anchorDisplayText.
     * @member {douyin.IText|null|undefined} anchorDisplayText
     * @memberof douyin.MemberMessage
     * @instance
     */
    MemberMessage.prototype.anchorDisplayText = null;

    /**
     * MemberMessage publicAreaCommon.
     * @member {douyin.IPublicAreaCommon|null|undefined} publicAreaCommon
     * @memberof douyin.MemberMessage
     * @instance
     */
    MemberMessage.prototype.publicAreaCommon = null;

    /**
     * MemberMessage userEnterTipType.
     * @member {number|Long} userEnterTipType
     * @memberof douyin.MemberMessage
     * @instance
     */
    MemberMessage.prototype.userEnterTipType = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * MemberMessage anchorEnterTipType.
     * @member {number|Long} anchorEnterTipType
     * @memberof douyin.MemberMessage
     * @instance
     */
    MemberMessage.prototype.anchorEnterTipType = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Creates a new MemberMessage instance using the specified properties.
     * @function create
     * @memberof douyin.MemberMessage
     * @static
     * @param {douyin.IMemberMessage=} [properties] Properties to set
     * @returns {douyin.MemberMessage} MemberMessage instance
     */
    MemberMessage.create = function create(properties) {
      return new MemberMessage(properties);
    };

    /**
     * Encodes the specified MemberMessage message. Does not implicitly {@link douyin.MemberMessage.verify|verify} messages.
     * @function encode
     * @memberof douyin.MemberMessage
     * @static
     * @param {douyin.IMemberMessage} message MemberMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    MemberMessage.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.common != null && Object.hasOwnProperty.call(message, "common"))
        $root.douyin.Common.encode(
          message.common,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (message.user != null && Object.hasOwnProperty.call(message, "user"))
        $root.douyin.User.encode(
          message.user,
          writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
        ).ldelim();
      if (message.memberCount != null && Object.hasOwnProperty.call(message, "memberCount"))
        writer.uint32(/* id 3, wireType 0 =*/ 24).uint64(message.memberCount);
      if (message.operator != null && Object.hasOwnProperty.call(message, "operator"))
        $root.douyin.User.encode(
          message.operator,
          writer.uint32(/* id 4, wireType 2 =*/ 34).fork(),
        ).ldelim();
      if (message.isSetToAdmin != null && Object.hasOwnProperty.call(message, "isSetToAdmin"))
        writer.uint32(/* id 5, wireType 0 =*/ 40).bool(message.isSetToAdmin);
      if (message.isTopUser != null && Object.hasOwnProperty.call(message, "isTopUser"))
        writer.uint32(/* id 6, wireType 0 =*/ 48).bool(message.isTopUser);
      if (message.rankScore != null && Object.hasOwnProperty.call(message, "rankScore"))
        writer.uint32(/* id 7, wireType 0 =*/ 56).uint64(message.rankScore);
      if (message.topUserNo != null && Object.hasOwnProperty.call(message, "topUserNo"))
        writer.uint32(/* id 8, wireType 0 =*/ 64).uint64(message.topUserNo);
      if (message.enterType != null && Object.hasOwnProperty.call(message, "enterType"))
        writer.uint32(/* id 9, wireType 0 =*/ 72).uint64(message.enterType);
      if (message.action != null && Object.hasOwnProperty.call(message, "action"))
        writer.uint32(/* id 10, wireType 0 =*/ 80).uint64(message.action);
      if (
        message.actionDescription != null &&
        Object.hasOwnProperty.call(message, "actionDescription")
      )
        writer.uint32(/* id 11, wireType 2 =*/ 90).string(message.actionDescription);
      if (message.userId != null && Object.hasOwnProperty.call(message, "userId"))
        writer.uint32(/* id 12, wireType 0 =*/ 96).uint64(message.userId);
      if (message.effectConfig != null && Object.hasOwnProperty.call(message, "effectConfig"))
        $root.douyin.EffectConfig.encode(
          message.effectConfig,
          writer.uint32(/* id 13, wireType 2 =*/ 106).fork(),
        ).ldelim();
      if (message.popStr != null && Object.hasOwnProperty.call(message, "popStr"))
        writer.uint32(/* id 14, wireType 2 =*/ 114).string(message.popStr);
      if (
        message.enterEffectConfig != null &&
        Object.hasOwnProperty.call(message, "enterEffectConfig")
      )
        $root.douyin.EffectConfig.encode(
          message.enterEffectConfig,
          writer.uint32(/* id 15, wireType 2 =*/ 122).fork(),
        ).ldelim();
      if (message.backgroundImage != null && Object.hasOwnProperty.call(message, "backgroundImage"))
        $root.douyin.Image.encode(
          message.backgroundImage,
          writer.uint32(/* id 16, wireType 2 =*/ 130).fork(),
        ).ldelim();
      if (
        message.backgroundImageV2 != null &&
        Object.hasOwnProperty.call(message, "backgroundImageV2")
      )
        $root.douyin.Image.encode(
          message.backgroundImageV2,
          writer.uint32(/* id 17, wireType 2 =*/ 138).fork(),
        ).ldelim();
      if (
        message.anchorDisplayText != null &&
        Object.hasOwnProperty.call(message, "anchorDisplayText")
      )
        $root.douyin.Text.encode(
          message.anchorDisplayText,
          writer.uint32(/* id 18, wireType 2 =*/ 146).fork(),
        ).ldelim();
      if (
        message.publicAreaCommon != null &&
        Object.hasOwnProperty.call(message, "publicAreaCommon")
      )
        $root.douyin.PublicAreaCommon.encode(
          message.publicAreaCommon,
          writer.uint32(/* id 19, wireType 2 =*/ 154).fork(),
        ).ldelim();
      if (
        message.userEnterTipType != null &&
        Object.hasOwnProperty.call(message, "userEnterTipType")
      )
        writer.uint32(/* id 20, wireType 0 =*/ 160).uint64(message.userEnterTipType);
      if (
        message.anchorEnterTipType != null &&
        Object.hasOwnProperty.call(message, "anchorEnterTipType")
      )
        writer.uint32(/* id 21, wireType 0 =*/ 168).uint64(message.anchorEnterTipType);
      return writer;
    };

    /**
     * Encodes the specified MemberMessage message, length delimited. Does not implicitly {@link douyin.MemberMessage.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.MemberMessage
     * @static
     * @param {douyin.IMemberMessage} message MemberMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    MemberMessage.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a MemberMessage message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.MemberMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.MemberMessage} MemberMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    MemberMessage.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.MemberMessage();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.common = $root.douyin.Common.decode(reader, reader.uint32());
            break;
          }
          case 2: {
            message.user = $root.douyin.User.decode(reader, reader.uint32());
            break;
          }
          case 3: {
            message.memberCount = reader.uint64();
            break;
          }
          case 4: {
            message.operator = $root.douyin.User.decode(reader, reader.uint32());
            break;
          }
          case 5: {
            message.isSetToAdmin = reader.bool();
            break;
          }
          case 6: {
            message.isTopUser = reader.bool();
            break;
          }
          case 7: {
            message.rankScore = reader.uint64();
            break;
          }
          case 8: {
            message.topUserNo = reader.uint64();
            break;
          }
          case 9: {
            message.enterType = reader.uint64();
            break;
          }
          case 10: {
            message.action = reader.uint64();
            break;
          }
          case 11: {
            message.actionDescription = reader.string();
            break;
          }
          case 12: {
            message.userId = reader.uint64();
            break;
          }
          case 13: {
            message.effectConfig = $root.douyin.EffectConfig.decode(reader, reader.uint32());
            break;
          }
          case 14: {
            message.popStr = reader.string();
            break;
          }
          case 15: {
            message.enterEffectConfig = $root.douyin.EffectConfig.decode(reader, reader.uint32());
            break;
          }
          case 16: {
            message.backgroundImage = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 17: {
            message.backgroundImageV2 = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 18: {
            message.anchorDisplayText = $root.douyin.Text.decode(reader, reader.uint32());
            break;
          }
          case 19: {
            message.publicAreaCommon = $root.douyin.PublicAreaCommon.decode(
              reader,
              reader.uint32(),
            );
            break;
          }
          case 20: {
            message.userEnterTipType = reader.uint64();
            break;
          }
          case 21: {
            message.anchorEnterTipType = reader.uint64();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a MemberMessage message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.MemberMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.MemberMessage} MemberMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    MemberMessage.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a MemberMessage message.
     * @function verify
     * @memberof douyin.MemberMessage
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    MemberMessage.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.common != null && message.hasOwnProperty("common")) {
        let error = $root.douyin.Common.verify(message.common);
        if (error) return "common." + error;
      }
      if (message.user != null && message.hasOwnProperty("user")) {
        let error = $root.douyin.User.verify(message.user);
        if (error) return "user." + error;
      }
      if (message.memberCount != null && message.hasOwnProperty("memberCount"))
        if (
          !$util.isInteger(message.memberCount) &&
          !(
            message.memberCount &&
            $util.isInteger(message.memberCount.low) &&
            $util.isInteger(message.memberCount.high)
          )
        )
          return "memberCount: integer|Long expected";
      if (message.operator != null && message.hasOwnProperty("operator")) {
        let error = $root.douyin.User.verify(message.operator);
        if (error) return "operator." + error;
      }
      if (message.isSetToAdmin != null && message.hasOwnProperty("isSetToAdmin"))
        if (typeof message.isSetToAdmin !== "boolean") return "isSetToAdmin: boolean expected";
      if (message.isTopUser != null && message.hasOwnProperty("isTopUser"))
        if (typeof message.isTopUser !== "boolean") return "isTopUser: boolean expected";
      if (message.rankScore != null && message.hasOwnProperty("rankScore"))
        if (
          !$util.isInteger(message.rankScore) &&
          !(
            message.rankScore &&
            $util.isInteger(message.rankScore.low) &&
            $util.isInteger(message.rankScore.high)
          )
        )
          return "rankScore: integer|Long expected";
      if (message.topUserNo != null && message.hasOwnProperty("topUserNo"))
        if (
          !$util.isInteger(message.topUserNo) &&
          !(
            message.topUserNo &&
            $util.isInteger(message.topUserNo.low) &&
            $util.isInteger(message.topUserNo.high)
          )
        )
          return "topUserNo: integer|Long expected";
      if (message.enterType != null && message.hasOwnProperty("enterType"))
        if (
          !$util.isInteger(message.enterType) &&
          !(
            message.enterType &&
            $util.isInteger(message.enterType.low) &&
            $util.isInteger(message.enterType.high)
          )
        )
          return "enterType: integer|Long expected";
      if (message.action != null && message.hasOwnProperty("action"))
        if (
          !$util.isInteger(message.action) &&
          !(
            message.action &&
            $util.isInteger(message.action.low) &&
            $util.isInteger(message.action.high)
          )
        )
          return "action: integer|Long expected";
      if (message.actionDescription != null && message.hasOwnProperty("actionDescription"))
        if (!$util.isString(message.actionDescription)) return "actionDescription: string expected";
      if (message.userId != null && message.hasOwnProperty("userId"))
        if (
          !$util.isInteger(message.userId) &&
          !(
            message.userId &&
            $util.isInteger(message.userId.low) &&
            $util.isInteger(message.userId.high)
          )
        )
          return "userId: integer|Long expected";
      if (message.effectConfig != null && message.hasOwnProperty("effectConfig")) {
        let error = $root.douyin.EffectConfig.verify(message.effectConfig);
        if (error) return "effectConfig." + error;
      }
      if (message.popStr != null && message.hasOwnProperty("popStr"))
        if (!$util.isString(message.popStr)) return "popStr: string expected";
      if (message.enterEffectConfig != null && message.hasOwnProperty("enterEffectConfig")) {
        let error = $root.douyin.EffectConfig.verify(message.enterEffectConfig);
        if (error) return "enterEffectConfig." + error;
      }
      if (message.backgroundImage != null && message.hasOwnProperty("backgroundImage")) {
        let error = $root.douyin.Image.verify(message.backgroundImage);
        if (error) return "backgroundImage." + error;
      }
      if (message.backgroundImageV2 != null && message.hasOwnProperty("backgroundImageV2")) {
        let error = $root.douyin.Image.verify(message.backgroundImageV2);
        if (error) return "backgroundImageV2." + error;
      }
      if (message.anchorDisplayText != null && message.hasOwnProperty("anchorDisplayText")) {
        let error = $root.douyin.Text.verify(message.anchorDisplayText);
        if (error) return "anchorDisplayText." + error;
      }
      if (message.publicAreaCommon != null && message.hasOwnProperty("publicAreaCommon")) {
        let error = $root.douyin.PublicAreaCommon.verify(message.publicAreaCommon);
        if (error) return "publicAreaCommon." + error;
      }
      if (message.userEnterTipType != null && message.hasOwnProperty("userEnterTipType"))
        if (
          !$util.isInteger(message.userEnterTipType) &&
          !(
            message.userEnterTipType &&
            $util.isInteger(message.userEnterTipType.low) &&
            $util.isInteger(message.userEnterTipType.high)
          )
        )
          return "userEnterTipType: integer|Long expected";
      if (message.anchorEnterTipType != null && message.hasOwnProperty("anchorEnterTipType"))
        if (
          !$util.isInteger(message.anchorEnterTipType) &&
          !(
            message.anchorEnterTipType &&
            $util.isInteger(message.anchorEnterTipType.low) &&
            $util.isInteger(message.anchorEnterTipType.high)
          )
        )
          return "anchorEnterTipType: integer|Long expected";
      return null;
    };

    /**
     * Creates a MemberMessage message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.MemberMessage
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.MemberMessage} MemberMessage
     */
    MemberMessage.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.MemberMessage) return object;
      let message = new $root.douyin.MemberMessage();
      if (object.common != null) {
        if (typeof object.common !== "object")
          throw TypeError(".douyin.MemberMessage.common: object expected");
        message.common = $root.douyin.Common.fromObject(object.common);
      }
      if (object.user != null) {
        if (typeof object.user !== "object")
          throw TypeError(".douyin.MemberMessage.user: object expected");
        message.user = $root.douyin.User.fromObject(object.user);
      }
      if (object.memberCount != null)
        if ($util.Long)
          (message.memberCount = $util.Long.fromValue(object.memberCount)).unsigned = true;
        else if (typeof object.memberCount === "string")
          message.memberCount = parseInt(object.memberCount, 10);
        else if (typeof object.memberCount === "number") message.memberCount = object.memberCount;
        else if (typeof object.memberCount === "object")
          message.memberCount = new $util.LongBits(
            object.memberCount.low >>> 0,
            object.memberCount.high >>> 0,
          ).toNumber(true);
      if (object.operator != null) {
        if (typeof object.operator !== "object")
          throw TypeError(".douyin.MemberMessage.operator: object expected");
        message.operator = $root.douyin.User.fromObject(object.operator);
      }
      if (object.isSetToAdmin != null) message.isSetToAdmin = Boolean(object.isSetToAdmin);
      if (object.isTopUser != null) message.isTopUser = Boolean(object.isTopUser);
      if (object.rankScore != null)
        if ($util.Long)
          (message.rankScore = $util.Long.fromValue(object.rankScore)).unsigned = true;
        else if (typeof object.rankScore === "string")
          message.rankScore = parseInt(object.rankScore, 10);
        else if (typeof object.rankScore === "number") message.rankScore = object.rankScore;
        else if (typeof object.rankScore === "object")
          message.rankScore = new $util.LongBits(
            object.rankScore.low >>> 0,
            object.rankScore.high >>> 0,
          ).toNumber(true);
      if (object.topUserNo != null)
        if ($util.Long)
          (message.topUserNo = $util.Long.fromValue(object.topUserNo)).unsigned = true;
        else if (typeof object.topUserNo === "string")
          message.topUserNo = parseInt(object.topUserNo, 10);
        else if (typeof object.topUserNo === "number") message.topUserNo = object.topUserNo;
        else if (typeof object.topUserNo === "object")
          message.topUserNo = new $util.LongBits(
            object.topUserNo.low >>> 0,
            object.topUserNo.high >>> 0,
          ).toNumber(true);
      if (object.enterType != null)
        if ($util.Long)
          (message.enterType = $util.Long.fromValue(object.enterType)).unsigned = true;
        else if (typeof object.enterType === "string")
          message.enterType = parseInt(object.enterType, 10);
        else if (typeof object.enterType === "number") message.enterType = object.enterType;
        else if (typeof object.enterType === "object")
          message.enterType = new $util.LongBits(
            object.enterType.low >>> 0,
            object.enterType.high >>> 0,
          ).toNumber(true);
      if (object.action != null)
        if ($util.Long) (message.action = $util.Long.fromValue(object.action)).unsigned = true;
        else if (typeof object.action === "string") message.action = parseInt(object.action, 10);
        else if (typeof object.action === "number") message.action = object.action;
        else if (typeof object.action === "object")
          message.action = new $util.LongBits(
            object.action.low >>> 0,
            object.action.high >>> 0,
          ).toNumber(true);
      if (object.actionDescription != null)
        message.actionDescription = String(object.actionDescription);
      if (object.userId != null)
        if ($util.Long) (message.userId = $util.Long.fromValue(object.userId)).unsigned = true;
        else if (typeof object.userId === "string") message.userId = parseInt(object.userId, 10);
        else if (typeof object.userId === "number") message.userId = object.userId;
        else if (typeof object.userId === "object")
          message.userId = new $util.LongBits(
            object.userId.low >>> 0,
            object.userId.high >>> 0,
          ).toNumber(true);
      if (object.effectConfig != null) {
        if (typeof object.effectConfig !== "object")
          throw TypeError(".douyin.MemberMessage.effectConfig: object expected");
        message.effectConfig = $root.douyin.EffectConfig.fromObject(object.effectConfig);
      }
      if (object.popStr != null) message.popStr = String(object.popStr);
      if (object.enterEffectConfig != null) {
        if (typeof object.enterEffectConfig !== "object")
          throw TypeError(".douyin.MemberMessage.enterEffectConfig: object expected");
        message.enterEffectConfig = $root.douyin.EffectConfig.fromObject(object.enterEffectConfig);
      }
      if (object.backgroundImage != null) {
        if (typeof object.backgroundImage !== "object")
          throw TypeError(".douyin.MemberMessage.backgroundImage: object expected");
        message.backgroundImage = $root.douyin.Image.fromObject(object.backgroundImage);
      }
      if (object.backgroundImageV2 != null) {
        if (typeof object.backgroundImageV2 !== "object")
          throw TypeError(".douyin.MemberMessage.backgroundImageV2: object expected");
        message.backgroundImageV2 = $root.douyin.Image.fromObject(object.backgroundImageV2);
      }
      if (object.anchorDisplayText != null) {
        if (typeof object.anchorDisplayText !== "object")
          throw TypeError(".douyin.MemberMessage.anchorDisplayText: object expected");
        message.anchorDisplayText = $root.douyin.Text.fromObject(object.anchorDisplayText);
      }
      if (object.publicAreaCommon != null) {
        if (typeof object.publicAreaCommon !== "object")
          throw TypeError(".douyin.MemberMessage.publicAreaCommon: object expected");
        message.publicAreaCommon = $root.douyin.PublicAreaCommon.fromObject(
          object.publicAreaCommon,
        );
      }
      if (object.userEnterTipType != null)
        if ($util.Long)
          (message.userEnterTipType = $util.Long.fromValue(object.userEnterTipType)).unsigned =
            true;
        else if (typeof object.userEnterTipType === "string")
          message.userEnterTipType = parseInt(object.userEnterTipType, 10);
        else if (typeof object.userEnterTipType === "number")
          message.userEnterTipType = object.userEnterTipType;
        else if (typeof object.userEnterTipType === "object")
          message.userEnterTipType = new $util.LongBits(
            object.userEnterTipType.low >>> 0,
            object.userEnterTipType.high >>> 0,
          ).toNumber(true);
      if (object.anchorEnterTipType != null)
        if ($util.Long)
          (message.anchorEnterTipType = $util.Long.fromValue(object.anchorEnterTipType)).unsigned =
            true;
        else if (typeof object.anchorEnterTipType === "string")
          message.anchorEnterTipType = parseInt(object.anchorEnterTipType, 10);
        else if (typeof object.anchorEnterTipType === "number")
          message.anchorEnterTipType = object.anchorEnterTipType;
        else if (typeof object.anchorEnterTipType === "object")
          message.anchorEnterTipType = new $util.LongBits(
            object.anchorEnterTipType.low >>> 0,
            object.anchorEnterTipType.high >>> 0,
          ).toNumber(true);
      return message;
    };

    /**
     * Creates a plain object from a MemberMessage message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.MemberMessage
     * @static
     * @param {douyin.MemberMessage} message MemberMessage
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    MemberMessage.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.common = null;
        object.user = null;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.memberCount =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.memberCount = options.longs === String ? "0" : 0;
        object.operator = null;
        object.isSetToAdmin = false;
        object.isTopUser = false;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.rankScore =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.rankScore = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.topUserNo =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.topUserNo = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.enterType =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.enterType = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.action =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.action = options.longs === String ? "0" : 0;
        object.actionDescription = "";
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.userId =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.userId = options.longs === String ? "0" : 0;
        object.effectConfig = null;
        object.popStr = "";
        object.enterEffectConfig = null;
        object.backgroundImage = null;
        object.backgroundImageV2 = null;
        object.anchorDisplayText = null;
        object.publicAreaCommon = null;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.userEnterTipType =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.userEnterTipType = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.anchorEnterTipType =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.anchorEnterTipType = options.longs === String ? "0" : 0;
      }
      if (message.common != null && message.hasOwnProperty("common"))
        object.common = $root.douyin.Common.toObject(message.common, options);
      if (message.user != null && message.hasOwnProperty("user"))
        object.user = $root.douyin.User.toObject(message.user, options);
      if (message.memberCount != null && message.hasOwnProperty("memberCount"))
        if (typeof message.memberCount === "number")
          object.memberCount =
            options.longs === String ? String(message.memberCount) : message.memberCount;
        else
          object.memberCount =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.memberCount)
              : options.longs === Number
                ? new $util.LongBits(
                    message.memberCount.low >>> 0,
                    message.memberCount.high >>> 0,
                  ).toNumber(true)
                : message.memberCount;
      if (message.operator != null && message.hasOwnProperty("operator"))
        object.operator = $root.douyin.User.toObject(message.operator, options);
      if (message.isSetToAdmin != null && message.hasOwnProperty("isSetToAdmin"))
        object.isSetToAdmin = message.isSetToAdmin;
      if (message.isTopUser != null && message.hasOwnProperty("isTopUser"))
        object.isTopUser = message.isTopUser;
      if (message.rankScore != null && message.hasOwnProperty("rankScore"))
        if (typeof message.rankScore === "number")
          object.rankScore =
            options.longs === String ? String(message.rankScore) : message.rankScore;
        else
          object.rankScore =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.rankScore)
              : options.longs === Number
                ? new $util.LongBits(
                    message.rankScore.low >>> 0,
                    message.rankScore.high >>> 0,
                  ).toNumber(true)
                : message.rankScore;
      if (message.topUserNo != null && message.hasOwnProperty("topUserNo"))
        if (typeof message.topUserNo === "number")
          object.topUserNo =
            options.longs === String ? String(message.topUserNo) : message.topUserNo;
        else
          object.topUserNo =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.topUserNo)
              : options.longs === Number
                ? new $util.LongBits(
                    message.topUserNo.low >>> 0,
                    message.topUserNo.high >>> 0,
                  ).toNumber(true)
                : message.topUserNo;
      if (message.enterType != null && message.hasOwnProperty("enterType"))
        if (typeof message.enterType === "number")
          object.enterType =
            options.longs === String ? String(message.enterType) : message.enterType;
        else
          object.enterType =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.enterType)
              : options.longs === Number
                ? new $util.LongBits(
                    message.enterType.low >>> 0,
                    message.enterType.high >>> 0,
                  ).toNumber(true)
                : message.enterType;
      if (message.action != null && message.hasOwnProperty("action"))
        if (typeof message.action === "number")
          object.action = options.longs === String ? String(message.action) : message.action;
        else
          object.action =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.action)
              : options.longs === Number
                ? new $util.LongBits(message.action.low >>> 0, message.action.high >>> 0).toNumber(
                    true,
                  )
                : message.action;
      if (message.actionDescription != null && message.hasOwnProperty("actionDescription"))
        object.actionDescription = message.actionDescription;
      if (message.userId != null && message.hasOwnProperty("userId"))
        if (typeof message.userId === "number")
          object.userId = options.longs === String ? String(message.userId) : message.userId;
        else
          object.userId =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.userId)
              : options.longs === Number
                ? new $util.LongBits(message.userId.low >>> 0, message.userId.high >>> 0).toNumber(
                    true,
                  )
                : message.userId;
      if (message.effectConfig != null && message.hasOwnProperty("effectConfig"))
        object.effectConfig = $root.douyin.EffectConfig.toObject(message.effectConfig, options);
      if (message.popStr != null && message.hasOwnProperty("popStr"))
        object.popStr = message.popStr;
      if (message.enterEffectConfig != null && message.hasOwnProperty("enterEffectConfig"))
        object.enterEffectConfig = $root.douyin.EffectConfig.toObject(
          message.enterEffectConfig,
          options,
        );
      if (message.backgroundImage != null && message.hasOwnProperty("backgroundImage"))
        object.backgroundImage = $root.douyin.Image.toObject(message.backgroundImage, options);
      if (message.backgroundImageV2 != null && message.hasOwnProperty("backgroundImageV2"))
        object.backgroundImageV2 = $root.douyin.Image.toObject(message.backgroundImageV2, options);
      if (message.anchorDisplayText != null && message.hasOwnProperty("anchorDisplayText"))
        object.anchorDisplayText = $root.douyin.Text.toObject(message.anchorDisplayText, options);
      if (message.publicAreaCommon != null && message.hasOwnProperty("publicAreaCommon"))
        object.publicAreaCommon = $root.douyin.PublicAreaCommon.toObject(
          message.publicAreaCommon,
          options,
        );
      if (message.userEnterTipType != null && message.hasOwnProperty("userEnterTipType"))
        if (typeof message.userEnterTipType === "number")
          object.userEnterTipType =
            options.longs === String ? String(message.userEnterTipType) : message.userEnterTipType;
        else
          object.userEnterTipType =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.userEnterTipType)
              : options.longs === Number
                ? new $util.LongBits(
                    message.userEnterTipType.low >>> 0,
                    message.userEnterTipType.high >>> 0,
                  ).toNumber(true)
                : message.userEnterTipType;
      if (message.anchorEnterTipType != null && message.hasOwnProperty("anchorEnterTipType"))
        if (typeof message.anchorEnterTipType === "number")
          object.anchorEnterTipType =
            options.longs === String
              ? String(message.anchorEnterTipType)
              : message.anchorEnterTipType;
        else
          object.anchorEnterTipType =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.anchorEnterTipType)
              : options.longs === Number
                ? new $util.LongBits(
                    message.anchorEnterTipType.low >>> 0,
                    message.anchorEnterTipType.high >>> 0,
                  ).toNumber(true)
                : message.anchorEnterTipType;
      return object;
    };

    /**
     * Converts this MemberMessage to JSON.
     * @function toJSON
     * @memberof douyin.MemberMessage
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    MemberMessage.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for MemberMessage
     * @function getTypeUrl
     * @memberof douyin.MemberMessage
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    MemberMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.MemberMessage";
    };

    return MemberMessage;
  })();

  douyin.PublicAreaCommon = (function () {
    /**
     * Properties of a PublicAreaCommon.
     * @memberof douyin
     * @interface IPublicAreaCommon
     * @property {douyin.IImage|null} [userLabel] PublicAreaCommon userLabel
     * @property {number|Long|null} [userConsumeInRoom] PublicAreaCommon userConsumeInRoom
     * @property {number|Long|null} [userSendGiftCntInRoom] PublicAreaCommon userSendGiftCntInRoom
     */

    /**
     * Constructs a new PublicAreaCommon.
     * @memberof douyin
     * @classdesc Represents a PublicAreaCommon.
     * @implements IPublicAreaCommon
     * @constructor
     * @param {douyin.IPublicAreaCommon=} [properties] Properties to set
     */
    function PublicAreaCommon(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * PublicAreaCommon userLabel.
     * @member {douyin.IImage|null|undefined} userLabel
     * @memberof douyin.PublicAreaCommon
     * @instance
     */
    PublicAreaCommon.prototype.userLabel = null;

    /**
     * PublicAreaCommon userConsumeInRoom.
     * @member {number|Long} userConsumeInRoom
     * @memberof douyin.PublicAreaCommon
     * @instance
     */
    PublicAreaCommon.prototype.userConsumeInRoom = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * PublicAreaCommon userSendGiftCntInRoom.
     * @member {number|Long} userSendGiftCntInRoom
     * @memberof douyin.PublicAreaCommon
     * @instance
     */
    PublicAreaCommon.prototype.userSendGiftCntInRoom = $util.Long
      ? $util.Long.fromBits(0, 0, true)
      : 0;

    /**
     * Creates a new PublicAreaCommon instance using the specified properties.
     * @function create
     * @memberof douyin.PublicAreaCommon
     * @static
     * @param {douyin.IPublicAreaCommon=} [properties] Properties to set
     * @returns {douyin.PublicAreaCommon} PublicAreaCommon instance
     */
    PublicAreaCommon.create = function create(properties) {
      return new PublicAreaCommon(properties);
    };

    /**
     * Encodes the specified PublicAreaCommon message. Does not implicitly {@link douyin.PublicAreaCommon.verify|verify} messages.
     * @function encode
     * @memberof douyin.PublicAreaCommon
     * @static
     * @param {douyin.IPublicAreaCommon} message PublicAreaCommon message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PublicAreaCommon.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.userLabel != null && Object.hasOwnProperty.call(message, "userLabel"))
        $root.douyin.Image.encode(
          message.userLabel,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (
        message.userConsumeInRoom != null &&
        Object.hasOwnProperty.call(message, "userConsumeInRoom")
      )
        writer.uint32(/* id 2, wireType 0 =*/ 16).uint64(message.userConsumeInRoom);
      if (
        message.userSendGiftCntInRoom != null &&
        Object.hasOwnProperty.call(message, "userSendGiftCntInRoom")
      )
        writer.uint32(/* id 3, wireType 0 =*/ 24).uint64(message.userSendGiftCntInRoom);
      return writer;
    };

    /**
     * Encodes the specified PublicAreaCommon message, length delimited. Does not implicitly {@link douyin.PublicAreaCommon.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.PublicAreaCommon
     * @static
     * @param {douyin.IPublicAreaCommon} message PublicAreaCommon message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PublicAreaCommon.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a PublicAreaCommon message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.PublicAreaCommon
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.PublicAreaCommon} PublicAreaCommon
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PublicAreaCommon.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.PublicAreaCommon();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.userLabel = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 2: {
            message.userConsumeInRoom = reader.uint64();
            break;
          }
          case 3: {
            message.userSendGiftCntInRoom = reader.uint64();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a PublicAreaCommon message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.PublicAreaCommon
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.PublicAreaCommon} PublicAreaCommon
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PublicAreaCommon.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a PublicAreaCommon message.
     * @function verify
     * @memberof douyin.PublicAreaCommon
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    PublicAreaCommon.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.userLabel != null && message.hasOwnProperty("userLabel")) {
        let error = $root.douyin.Image.verify(message.userLabel);
        if (error) return "userLabel." + error;
      }
      if (message.userConsumeInRoom != null && message.hasOwnProperty("userConsumeInRoom"))
        if (
          !$util.isInteger(message.userConsumeInRoom) &&
          !(
            message.userConsumeInRoom &&
            $util.isInteger(message.userConsumeInRoom.low) &&
            $util.isInteger(message.userConsumeInRoom.high)
          )
        )
          return "userConsumeInRoom: integer|Long expected";
      if (message.userSendGiftCntInRoom != null && message.hasOwnProperty("userSendGiftCntInRoom"))
        if (
          !$util.isInteger(message.userSendGiftCntInRoom) &&
          !(
            message.userSendGiftCntInRoom &&
            $util.isInteger(message.userSendGiftCntInRoom.low) &&
            $util.isInteger(message.userSendGiftCntInRoom.high)
          )
        )
          return "userSendGiftCntInRoom: integer|Long expected";
      return null;
    };

    /**
     * Creates a PublicAreaCommon message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.PublicAreaCommon
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.PublicAreaCommon} PublicAreaCommon
     */
    PublicAreaCommon.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.PublicAreaCommon) return object;
      let message = new $root.douyin.PublicAreaCommon();
      if (object.userLabel != null) {
        if (typeof object.userLabel !== "object")
          throw TypeError(".douyin.PublicAreaCommon.userLabel: object expected");
        message.userLabel = $root.douyin.Image.fromObject(object.userLabel);
      }
      if (object.userConsumeInRoom != null)
        if ($util.Long)
          (message.userConsumeInRoom = $util.Long.fromValue(object.userConsumeInRoom)).unsigned =
            true;
        else if (typeof object.userConsumeInRoom === "string")
          message.userConsumeInRoom = parseInt(object.userConsumeInRoom, 10);
        else if (typeof object.userConsumeInRoom === "number")
          message.userConsumeInRoom = object.userConsumeInRoom;
        else if (typeof object.userConsumeInRoom === "object")
          message.userConsumeInRoom = new $util.LongBits(
            object.userConsumeInRoom.low >>> 0,
            object.userConsumeInRoom.high >>> 0,
          ).toNumber(true);
      if (object.userSendGiftCntInRoom != null)
        if ($util.Long)
          (message.userSendGiftCntInRoom = $util.Long.fromValue(
            object.userSendGiftCntInRoom,
          )).unsigned = true;
        else if (typeof object.userSendGiftCntInRoom === "string")
          message.userSendGiftCntInRoom = parseInt(object.userSendGiftCntInRoom, 10);
        else if (typeof object.userSendGiftCntInRoom === "number")
          message.userSendGiftCntInRoom = object.userSendGiftCntInRoom;
        else if (typeof object.userSendGiftCntInRoom === "object")
          message.userSendGiftCntInRoom = new $util.LongBits(
            object.userSendGiftCntInRoom.low >>> 0,
            object.userSendGiftCntInRoom.high >>> 0,
          ).toNumber(true);
      return message;
    };

    /**
     * Creates a plain object from a PublicAreaCommon message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.PublicAreaCommon
     * @static
     * @param {douyin.PublicAreaCommon} message PublicAreaCommon
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    PublicAreaCommon.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.userLabel = null;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.userConsumeInRoom =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.userConsumeInRoom = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.userSendGiftCntInRoom =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.userSendGiftCntInRoom = options.longs === String ? "0" : 0;
      }
      if (message.userLabel != null && message.hasOwnProperty("userLabel"))
        object.userLabel = $root.douyin.Image.toObject(message.userLabel, options);
      if (message.userConsumeInRoom != null && message.hasOwnProperty("userConsumeInRoom"))
        if (typeof message.userConsumeInRoom === "number")
          object.userConsumeInRoom =
            options.longs === String
              ? String(message.userConsumeInRoom)
              : message.userConsumeInRoom;
        else
          object.userConsumeInRoom =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.userConsumeInRoom)
              : options.longs === Number
                ? new $util.LongBits(
                    message.userConsumeInRoom.low >>> 0,
                    message.userConsumeInRoom.high >>> 0,
                  ).toNumber(true)
                : message.userConsumeInRoom;
      if (message.userSendGiftCntInRoom != null && message.hasOwnProperty("userSendGiftCntInRoom"))
        if (typeof message.userSendGiftCntInRoom === "number")
          object.userSendGiftCntInRoom =
            options.longs === String
              ? String(message.userSendGiftCntInRoom)
              : message.userSendGiftCntInRoom;
        else
          object.userSendGiftCntInRoom =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.userSendGiftCntInRoom)
              : options.longs === Number
                ? new $util.LongBits(
                    message.userSendGiftCntInRoom.low >>> 0,
                    message.userSendGiftCntInRoom.high >>> 0,
                  ).toNumber(true)
                : message.userSendGiftCntInRoom;
      return object;
    };

    /**
     * Converts this PublicAreaCommon to JSON.
     * @function toJSON
     * @memberof douyin.PublicAreaCommon
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    PublicAreaCommon.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for PublicAreaCommon
     * @function getTypeUrl
     * @memberof douyin.PublicAreaCommon
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    PublicAreaCommon.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.PublicAreaCommon";
    };

    return PublicAreaCommon;
  })();

  douyin.EffectConfig = (function () {
    /**
     * Properties of an EffectConfig.
     * @memberof douyin
     * @interface IEffectConfig
     * @property {number|Long|null} [type] EffectConfig type
     * @property {douyin.IImage|null} [icon] EffectConfig icon
     * @property {number|Long|null} [avatarPos] EffectConfig avatarPos
     * @property {douyin.IText|null} [text] EffectConfig text
     * @property {douyin.IImage|null} [textIcon] EffectConfig textIcon
     * @property {number|null} [stayTime] EffectConfig stayTime
     * @property {number|Long|null} [animAssetId] EffectConfig animAssetId
     * @property {douyin.IImage|null} [badge] EffectConfig badge
     * @property {Array.<number|Long>|null} [flexSettingArrayList] EffectConfig flexSettingArrayList
     * @property {douyin.IImage|null} [textIconOverlay] EffectConfig textIconOverlay
     * @property {douyin.IImage|null} [animatedBadge] EffectConfig animatedBadge
     * @property {boolean|null} [hasSweepLight] EffectConfig hasSweepLight
     * @property {Array.<number|Long>|null} [textFlexSettingArrayList] EffectConfig textFlexSettingArrayList
     * @property {number|Long|null} [centerAnimAssetId] EffectConfig centerAnimAssetId
     * @property {douyin.IImage|null} [dynamicImage] EffectConfig dynamicImage
     * @property {Object.<string,string>|null} [extraMap] EffectConfig extraMap
     * @property {number|Long|null} [mp4AnimAssetId] EffectConfig mp4AnimAssetId
     * @property {number|Long|null} [priority] EffectConfig priority
     * @property {number|Long|null} [maxWaitTime] EffectConfig maxWaitTime
     * @property {string|null} [dressId] EffectConfig dressId
     * @property {number|Long|null} [alignment] EffectConfig alignment
     * @property {number|Long|null} [alignmentOffset] EffectConfig alignmentOffset
     */

    /**
     * Constructs a new EffectConfig.
     * @memberof douyin
     * @classdesc Represents an EffectConfig.
     * @implements IEffectConfig
     * @constructor
     * @param {douyin.IEffectConfig=} [properties] Properties to set
     */
    function EffectConfig(properties) {
      this.flexSettingArrayList = [];
      this.textFlexSettingArrayList = [];
      this.extraMap = {};
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * EffectConfig type.
     * @member {number|Long} type
     * @memberof douyin.EffectConfig
     * @instance
     */
    EffectConfig.prototype.type = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * EffectConfig icon.
     * @member {douyin.IImage|null|undefined} icon
     * @memberof douyin.EffectConfig
     * @instance
     */
    EffectConfig.prototype.icon = null;

    /**
     * EffectConfig avatarPos.
     * @member {number|Long} avatarPos
     * @memberof douyin.EffectConfig
     * @instance
     */
    EffectConfig.prototype.avatarPos = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * EffectConfig text.
     * @member {douyin.IText|null|undefined} text
     * @memberof douyin.EffectConfig
     * @instance
     */
    EffectConfig.prototype.text = null;

    /**
     * EffectConfig textIcon.
     * @member {douyin.IImage|null|undefined} textIcon
     * @memberof douyin.EffectConfig
     * @instance
     */
    EffectConfig.prototype.textIcon = null;

    /**
     * EffectConfig stayTime.
     * @member {number} stayTime
     * @memberof douyin.EffectConfig
     * @instance
     */
    EffectConfig.prototype.stayTime = 0;

    /**
     * EffectConfig animAssetId.
     * @member {number|Long} animAssetId
     * @memberof douyin.EffectConfig
     * @instance
     */
    EffectConfig.prototype.animAssetId = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * EffectConfig badge.
     * @member {douyin.IImage|null|undefined} badge
     * @memberof douyin.EffectConfig
     * @instance
     */
    EffectConfig.prototype.badge = null;

    /**
     * EffectConfig flexSettingArrayList.
     * @member {Array.<number|Long>} flexSettingArrayList
     * @memberof douyin.EffectConfig
     * @instance
     */
    EffectConfig.prototype.flexSettingArrayList = $util.emptyArray;

    /**
     * EffectConfig textIconOverlay.
     * @member {douyin.IImage|null|undefined} textIconOverlay
     * @memberof douyin.EffectConfig
     * @instance
     */
    EffectConfig.prototype.textIconOverlay = null;

    /**
     * EffectConfig animatedBadge.
     * @member {douyin.IImage|null|undefined} animatedBadge
     * @memberof douyin.EffectConfig
     * @instance
     */
    EffectConfig.prototype.animatedBadge = null;

    /**
     * EffectConfig hasSweepLight.
     * @member {boolean} hasSweepLight
     * @memberof douyin.EffectConfig
     * @instance
     */
    EffectConfig.prototype.hasSweepLight = false;

    /**
     * EffectConfig textFlexSettingArrayList.
     * @member {Array.<number|Long>} textFlexSettingArrayList
     * @memberof douyin.EffectConfig
     * @instance
     */
    EffectConfig.prototype.textFlexSettingArrayList = $util.emptyArray;

    /**
     * EffectConfig centerAnimAssetId.
     * @member {number|Long} centerAnimAssetId
     * @memberof douyin.EffectConfig
     * @instance
     */
    EffectConfig.prototype.centerAnimAssetId = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * EffectConfig dynamicImage.
     * @member {douyin.IImage|null|undefined} dynamicImage
     * @memberof douyin.EffectConfig
     * @instance
     */
    EffectConfig.prototype.dynamicImage = null;

    /**
     * EffectConfig extraMap.
     * @member {Object.<string,string>} extraMap
     * @memberof douyin.EffectConfig
     * @instance
     */
    EffectConfig.prototype.extraMap = $util.emptyObject;

    /**
     * EffectConfig mp4AnimAssetId.
     * @member {number|Long} mp4AnimAssetId
     * @memberof douyin.EffectConfig
     * @instance
     */
    EffectConfig.prototype.mp4AnimAssetId = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * EffectConfig priority.
     * @member {number|Long} priority
     * @memberof douyin.EffectConfig
     * @instance
     */
    EffectConfig.prototype.priority = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * EffectConfig maxWaitTime.
     * @member {number|Long} maxWaitTime
     * @memberof douyin.EffectConfig
     * @instance
     */
    EffectConfig.prototype.maxWaitTime = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * EffectConfig dressId.
     * @member {string} dressId
     * @memberof douyin.EffectConfig
     * @instance
     */
    EffectConfig.prototype.dressId = "";

    /**
     * EffectConfig alignment.
     * @member {number|Long} alignment
     * @memberof douyin.EffectConfig
     * @instance
     */
    EffectConfig.prototype.alignment = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * EffectConfig alignmentOffset.
     * @member {number|Long} alignmentOffset
     * @memberof douyin.EffectConfig
     * @instance
     */
    EffectConfig.prototype.alignmentOffset = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Creates a new EffectConfig instance using the specified properties.
     * @function create
     * @memberof douyin.EffectConfig
     * @static
     * @param {douyin.IEffectConfig=} [properties] Properties to set
     * @returns {douyin.EffectConfig} EffectConfig instance
     */
    EffectConfig.create = function create(properties) {
      return new EffectConfig(properties);
    };

    /**
     * Encodes the specified EffectConfig message. Does not implicitly {@link douyin.EffectConfig.verify|verify} messages.
     * @function encode
     * @memberof douyin.EffectConfig
     * @static
     * @param {douyin.IEffectConfig} message EffectConfig message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    EffectConfig.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.type != null && Object.hasOwnProperty.call(message, "type"))
        writer.uint32(/* id 1, wireType 0 =*/ 8).uint64(message.type);
      if (message.icon != null && Object.hasOwnProperty.call(message, "icon"))
        $root.douyin.Image.encode(
          message.icon,
          writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
        ).ldelim();
      if (message.avatarPos != null && Object.hasOwnProperty.call(message, "avatarPos"))
        writer.uint32(/* id 3, wireType 0 =*/ 24).uint64(message.avatarPos);
      if (message.text != null && Object.hasOwnProperty.call(message, "text"))
        $root.douyin.Text.encode(
          message.text,
          writer.uint32(/* id 4, wireType 2 =*/ 34).fork(),
        ).ldelim();
      if (message.textIcon != null && Object.hasOwnProperty.call(message, "textIcon"))
        $root.douyin.Image.encode(
          message.textIcon,
          writer.uint32(/* id 5, wireType 2 =*/ 42).fork(),
        ).ldelim();
      if (message.stayTime != null && Object.hasOwnProperty.call(message, "stayTime"))
        writer.uint32(/* id 6, wireType 0 =*/ 48).uint32(message.stayTime);
      if (message.animAssetId != null && Object.hasOwnProperty.call(message, "animAssetId"))
        writer.uint32(/* id 7, wireType 0 =*/ 56).uint64(message.animAssetId);
      if (message.badge != null && Object.hasOwnProperty.call(message, "badge"))
        $root.douyin.Image.encode(
          message.badge,
          writer.uint32(/* id 8, wireType 2 =*/ 66).fork(),
        ).ldelim();
      if (message.flexSettingArrayList != null && message.flexSettingArrayList.length) {
        writer.uint32(/* id 9, wireType 2 =*/ 74).fork();
        for (let i = 0; i < message.flexSettingArrayList.length; ++i)
          writer.uint64(message.flexSettingArrayList[i]);
        writer.ldelim();
      }
      if (message.textIconOverlay != null && Object.hasOwnProperty.call(message, "textIconOverlay"))
        $root.douyin.Image.encode(
          message.textIconOverlay,
          writer.uint32(/* id 10, wireType 2 =*/ 82).fork(),
        ).ldelim();
      if (message.animatedBadge != null && Object.hasOwnProperty.call(message, "animatedBadge"))
        $root.douyin.Image.encode(
          message.animatedBadge,
          writer.uint32(/* id 11, wireType 2 =*/ 90).fork(),
        ).ldelim();
      if (message.hasSweepLight != null && Object.hasOwnProperty.call(message, "hasSweepLight"))
        writer.uint32(/* id 12, wireType 0 =*/ 96).bool(message.hasSweepLight);
      if (message.textFlexSettingArrayList != null && message.textFlexSettingArrayList.length) {
        writer.uint32(/* id 13, wireType 2 =*/ 106).fork();
        for (let i = 0; i < message.textFlexSettingArrayList.length; ++i)
          writer.uint64(message.textFlexSettingArrayList[i]);
        writer.ldelim();
      }
      if (
        message.centerAnimAssetId != null &&
        Object.hasOwnProperty.call(message, "centerAnimAssetId")
      )
        writer.uint32(/* id 14, wireType 0 =*/ 112).uint64(message.centerAnimAssetId);
      if (message.dynamicImage != null && Object.hasOwnProperty.call(message, "dynamicImage"))
        $root.douyin.Image.encode(
          message.dynamicImage,
          writer.uint32(/* id 15, wireType 2 =*/ 122).fork(),
        ).ldelim();
      if (message.extraMap != null && Object.hasOwnProperty.call(message, "extraMap"))
        for (let keys = Object.keys(message.extraMap), i = 0; i < keys.length; ++i)
          writer
            .uint32(/* id 16, wireType 2 =*/ 130)
            .fork()
            .uint32(/* id 1, wireType 2 =*/ 10)
            .string(keys[i])
            .uint32(/* id 2, wireType 2 =*/ 18)
            .string(message.extraMap[keys[i]])
            .ldelim();
      if (message.mp4AnimAssetId != null && Object.hasOwnProperty.call(message, "mp4AnimAssetId"))
        writer.uint32(/* id 17, wireType 0 =*/ 136).uint64(message.mp4AnimAssetId);
      if (message.priority != null && Object.hasOwnProperty.call(message, "priority"))
        writer.uint32(/* id 18, wireType 0 =*/ 144).uint64(message.priority);
      if (message.maxWaitTime != null && Object.hasOwnProperty.call(message, "maxWaitTime"))
        writer.uint32(/* id 19, wireType 0 =*/ 152).uint64(message.maxWaitTime);
      if (message.dressId != null && Object.hasOwnProperty.call(message, "dressId"))
        writer.uint32(/* id 20, wireType 2 =*/ 162).string(message.dressId);
      if (message.alignment != null && Object.hasOwnProperty.call(message, "alignment"))
        writer.uint32(/* id 21, wireType 0 =*/ 168).uint64(message.alignment);
      if (message.alignmentOffset != null && Object.hasOwnProperty.call(message, "alignmentOffset"))
        writer.uint32(/* id 22, wireType 0 =*/ 176).uint64(message.alignmentOffset);
      return writer;
    };

    /**
     * Encodes the specified EffectConfig message, length delimited. Does not implicitly {@link douyin.EffectConfig.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.EffectConfig
     * @static
     * @param {douyin.IEffectConfig} message EffectConfig message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    EffectConfig.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes an EffectConfig message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.EffectConfig
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.EffectConfig} EffectConfig
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    EffectConfig.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.EffectConfig(),
        key,
        value;
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.type = reader.uint64();
            break;
          }
          case 2: {
            message.icon = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 3: {
            message.avatarPos = reader.uint64();
            break;
          }
          case 4: {
            message.text = $root.douyin.Text.decode(reader, reader.uint32());
            break;
          }
          case 5: {
            message.textIcon = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 6: {
            message.stayTime = reader.uint32();
            break;
          }
          case 7: {
            message.animAssetId = reader.uint64();
            break;
          }
          case 8: {
            message.badge = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 9: {
            if (!(message.flexSettingArrayList && message.flexSettingArrayList.length))
              message.flexSettingArrayList = [];
            if ((tag & 7) === 2) {
              let end2 = reader.uint32() + reader.pos;
              while (reader.pos < end2) message.flexSettingArrayList.push(reader.uint64());
            } else message.flexSettingArrayList.push(reader.uint64());
            break;
          }
          case 10: {
            message.textIconOverlay = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 11: {
            message.animatedBadge = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 12: {
            message.hasSweepLight = reader.bool();
            break;
          }
          case 13: {
            if (!(message.textFlexSettingArrayList && message.textFlexSettingArrayList.length))
              message.textFlexSettingArrayList = [];
            if ((tag & 7) === 2) {
              let end2 = reader.uint32() + reader.pos;
              while (reader.pos < end2) message.textFlexSettingArrayList.push(reader.uint64());
            } else message.textFlexSettingArrayList.push(reader.uint64());
            break;
          }
          case 14: {
            message.centerAnimAssetId = reader.uint64();
            break;
          }
          case 15: {
            message.dynamicImage = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 16: {
            if (message.extraMap === $util.emptyObject) message.extraMap = {};
            let end2 = reader.uint32() + reader.pos;
            key = "";
            value = "";
            while (reader.pos < end2) {
              let tag2 = reader.uint32();
              switch (tag2 >>> 3) {
                case 1:
                  key = reader.string();
                  break;
                case 2:
                  value = reader.string();
                  break;
                default:
                  reader.skipType(tag2 & 7);
                  break;
              }
            }
            message.extraMap[key] = value;
            break;
          }
          case 17: {
            message.mp4AnimAssetId = reader.uint64();
            break;
          }
          case 18: {
            message.priority = reader.uint64();
            break;
          }
          case 19: {
            message.maxWaitTime = reader.uint64();
            break;
          }
          case 20: {
            message.dressId = reader.string();
            break;
          }
          case 21: {
            message.alignment = reader.uint64();
            break;
          }
          case 22: {
            message.alignmentOffset = reader.uint64();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes an EffectConfig message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.EffectConfig
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.EffectConfig} EffectConfig
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    EffectConfig.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies an EffectConfig message.
     * @function verify
     * @memberof douyin.EffectConfig
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    EffectConfig.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.type != null && message.hasOwnProperty("type"))
        if (
          !$util.isInteger(message.type) &&
          !(message.type && $util.isInteger(message.type.low) && $util.isInteger(message.type.high))
        )
          return "type: integer|Long expected";
      if (message.icon != null && message.hasOwnProperty("icon")) {
        let error = $root.douyin.Image.verify(message.icon);
        if (error) return "icon." + error;
      }
      if (message.avatarPos != null && message.hasOwnProperty("avatarPos"))
        if (
          !$util.isInteger(message.avatarPos) &&
          !(
            message.avatarPos &&
            $util.isInteger(message.avatarPos.low) &&
            $util.isInteger(message.avatarPos.high)
          )
        )
          return "avatarPos: integer|Long expected";
      if (message.text != null && message.hasOwnProperty("text")) {
        let error = $root.douyin.Text.verify(message.text);
        if (error) return "text." + error;
      }
      if (message.textIcon != null && message.hasOwnProperty("textIcon")) {
        let error = $root.douyin.Image.verify(message.textIcon);
        if (error) return "textIcon." + error;
      }
      if (message.stayTime != null && message.hasOwnProperty("stayTime"))
        if (!$util.isInteger(message.stayTime)) return "stayTime: integer expected";
      if (message.animAssetId != null && message.hasOwnProperty("animAssetId"))
        if (
          !$util.isInteger(message.animAssetId) &&
          !(
            message.animAssetId &&
            $util.isInteger(message.animAssetId.low) &&
            $util.isInteger(message.animAssetId.high)
          )
        )
          return "animAssetId: integer|Long expected";
      if (message.badge != null && message.hasOwnProperty("badge")) {
        let error = $root.douyin.Image.verify(message.badge);
        if (error) return "badge." + error;
      }
      if (message.flexSettingArrayList != null && message.hasOwnProperty("flexSettingArrayList")) {
        if (!Array.isArray(message.flexSettingArrayList))
          return "flexSettingArrayList: array expected";
        for (let i = 0; i < message.flexSettingArrayList.length; ++i)
          if (
            !$util.isInteger(message.flexSettingArrayList[i]) &&
            !(
              message.flexSettingArrayList[i] &&
              $util.isInteger(message.flexSettingArrayList[i].low) &&
              $util.isInteger(message.flexSettingArrayList[i].high)
            )
          )
            return "flexSettingArrayList: integer|Long[] expected";
      }
      if (message.textIconOverlay != null && message.hasOwnProperty("textIconOverlay")) {
        let error = $root.douyin.Image.verify(message.textIconOverlay);
        if (error) return "textIconOverlay." + error;
      }
      if (message.animatedBadge != null && message.hasOwnProperty("animatedBadge")) {
        let error = $root.douyin.Image.verify(message.animatedBadge);
        if (error) return "animatedBadge." + error;
      }
      if (message.hasSweepLight != null && message.hasOwnProperty("hasSweepLight"))
        if (typeof message.hasSweepLight !== "boolean") return "hasSweepLight: boolean expected";
      if (
        message.textFlexSettingArrayList != null &&
        message.hasOwnProperty("textFlexSettingArrayList")
      ) {
        if (!Array.isArray(message.textFlexSettingArrayList))
          return "textFlexSettingArrayList: array expected";
        for (let i = 0; i < message.textFlexSettingArrayList.length; ++i)
          if (
            !$util.isInteger(message.textFlexSettingArrayList[i]) &&
            !(
              message.textFlexSettingArrayList[i] &&
              $util.isInteger(message.textFlexSettingArrayList[i].low) &&
              $util.isInteger(message.textFlexSettingArrayList[i].high)
            )
          )
            return "textFlexSettingArrayList: integer|Long[] expected";
      }
      if (message.centerAnimAssetId != null && message.hasOwnProperty("centerAnimAssetId"))
        if (
          !$util.isInteger(message.centerAnimAssetId) &&
          !(
            message.centerAnimAssetId &&
            $util.isInteger(message.centerAnimAssetId.low) &&
            $util.isInteger(message.centerAnimAssetId.high)
          )
        )
          return "centerAnimAssetId: integer|Long expected";
      if (message.dynamicImage != null && message.hasOwnProperty("dynamicImage")) {
        let error = $root.douyin.Image.verify(message.dynamicImage);
        if (error) return "dynamicImage." + error;
      }
      if (message.extraMap != null && message.hasOwnProperty("extraMap")) {
        if (!$util.isObject(message.extraMap)) return "extraMap: object expected";
        let key = Object.keys(message.extraMap);
        for (let i = 0; i < key.length; ++i)
          if (!$util.isString(message.extraMap[key[i]]))
            return "extraMap: string{k:string} expected";
      }
      if (message.mp4AnimAssetId != null && message.hasOwnProperty("mp4AnimAssetId"))
        if (
          !$util.isInteger(message.mp4AnimAssetId) &&
          !(
            message.mp4AnimAssetId &&
            $util.isInteger(message.mp4AnimAssetId.low) &&
            $util.isInteger(message.mp4AnimAssetId.high)
          )
        )
          return "mp4AnimAssetId: integer|Long expected";
      if (message.priority != null && message.hasOwnProperty("priority"))
        if (
          !$util.isInteger(message.priority) &&
          !(
            message.priority &&
            $util.isInteger(message.priority.low) &&
            $util.isInteger(message.priority.high)
          )
        )
          return "priority: integer|Long expected";
      if (message.maxWaitTime != null && message.hasOwnProperty("maxWaitTime"))
        if (
          !$util.isInteger(message.maxWaitTime) &&
          !(
            message.maxWaitTime &&
            $util.isInteger(message.maxWaitTime.low) &&
            $util.isInteger(message.maxWaitTime.high)
          )
        )
          return "maxWaitTime: integer|Long expected";
      if (message.dressId != null && message.hasOwnProperty("dressId"))
        if (!$util.isString(message.dressId)) return "dressId: string expected";
      if (message.alignment != null && message.hasOwnProperty("alignment"))
        if (
          !$util.isInteger(message.alignment) &&
          !(
            message.alignment &&
            $util.isInteger(message.alignment.low) &&
            $util.isInteger(message.alignment.high)
          )
        )
          return "alignment: integer|Long expected";
      if (message.alignmentOffset != null && message.hasOwnProperty("alignmentOffset"))
        if (
          !$util.isInteger(message.alignmentOffset) &&
          !(
            message.alignmentOffset &&
            $util.isInteger(message.alignmentOffset.low) &&
            $util.isInteger(message.alignmentOffset.high)
          )
        )
          return "alignmentOffset: integer|Long expected";
      return null;
    };

    /**
     * Creates an EffectConfig message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.EffectConfig
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.EffectConfig} EffectConfig
     */
    EffectConfig.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.EffectConfig) return object;
      let message = new $root.douyin.EffectConfig();
      if (object.type != null)
        if ($util.Long) (message.type = $util.Long.fromValue(object.type)).unsigned = true;
        else if (typeof object.type === "string") message.type = parseInt(object.type, 10);
        else if (typeof object.type === "number") message.type = object.type;
        else if (typeof object.type === "object")
          message.type = new $util.LongBits(object.type.low >>> 0, object.type.high >>> 0).toNumber(
            true,
          );
      if (object.icon != null) {
        if (typeof object.icon !== "object")
          throw TypeError(".douyin.EffectConfig.icon: object expected");
        message.icon = $root.douyin.Image.fromObject(object.icon);
      }
      if (object.avatarPos != null)
        if ($util.Long)
          (message.avatarPos = $util.Long.fromValue(object.avatarPos)).unsigned = true;
        else if (typeof object.avatarPos === "string")
          message.avatarPos = parseInt(object.avatarPos, 10);
        else if (typeof object.avatarPos === "number") message.avatarPos = object.avatarPos;
        else if (typeof object.avatarPos === "object")
          message.avatarPos = new $util.LongBits(
            object.avatarPos.low >>> 0,
            object.avatarPos.high >>> 0,
          ).toNumber(true);
      if (object.text != null) {
        if (typeof object.text !== "object")
          throw TypeError(".douyin.EffectConfig.text: object expected");
        message.text = $root.douyin.Text.fromObject(object.text);
      }
      if (object.textIcon != null) {
        if (typeof object.textIcon !== "object")
          throw TypeError(".douyin.EffectConfig.textIcon: object expected");
        message.textIcon = $root.douyin.Image.fromObject(object.textIcon);
      }
      if (object.stayTime != null) message.stayTime = object.stayTime >>> 0;
      if (object.animAssetId != null)
        if ($util.Long)
          (message.animAssetId = $util.Long.fromValue(object.animAssetId)).unsigned = true;
        else if (typeof object.animAssetId === "string")
          message.animAssetId = parseInt(object.animAssetId, 10);
        else if (typeof object.animAssetId === "number") message.animAssetId = object.animAssetId;
        else if (typeof object.animAssetId === "object")
          message.animAssetId = new $util.LongBits(
            object.animAssetId.low >>> 0,
            object.animAssetId.high >>> 0,
          ).toNumber(true);
      if (object.badge != null) {
        if (typeof object.badge !== "object")
          throw TypeError(".douyin.EffectConfig.badge: object expected");
        message.badge = $root.douyin.Image.fromObject(object.badge);
      }
      if (object.flexSettingArrayList) {
        if (!Array.isArray(object.flexSettingArrayList))
          throw TypeError(".douyin.EffectConfig.flexSettingArrayList: array expected");
        message.flexSettingArrayList = [];
        for (let i = 0; i < object.flexSettingArrayList.length; ++i)
          if ($util.Long)
            (message.flexSettingArrayList[i] = $util.Long.fromValue(
              object.flexSettingArrayList[i],
            )).unsigned = true;
          else if (typeof object.flexSettingArrayList[i] === "string")
            message.flexSettingArrayList[i] = parseInt(object.flexSettingArrayList[i], 10);
          else if (typeof object.flexSettingArrayList[i] === "number")
            message.flexSettingArrayList[i] = object.flexSettingArrayList[i];
          else if (typeof object.flexSettingArrayList[i] === "object")
            message.flexSettingArrayList[i] = new $util.LongBits(
              object.flexSettingArrayList[i].low >>> 0,
              object.flexSettingArrayList[i].high >>> 0,
            ).toNumber(true);
      }
      if (object.textIconOverlay != null) {
        if (typeof object.textIconOverlay !== "object")
          throw TypeError(".douyin.EffectConfig.textIconOverlay: object expected");
        message.textIconOverlay = $root.douyin.Image.fromObject(object.textIconOverlay);
      }
      if (object.animatedBadge != null) {
        if (typeof object.animatedBadge !== "object")
          throw TypeError(".douyin.EffectConfig.animatedBadge: object expected");
        message.animatedBadge = $root.douyin.Image.fromObject(object.animatedBadge);
      }
      if (object.hasSweepLight != null) message.hasSweepLight = Boolean(object.hasSweepLight);
      if (object.textFlexSettingArrayList) {
        if (!Array.isArray(object.textFlexSettingArrayList))
          throw TypeError(".douyin.EffectConfig.textFlexSettingArrayList: array expected");
        message.textFlexSettingArrayList = [];
        for (let i = 0; i < object.textFlexSettingArrayList.length; ++i)
          if ($util.Long)
            (message.textFlexSettingArrayList[i] = $util.Long.fromValue(
              object.textFlexSettingArrayList[i],
            )).unsigned = true;
          else if (typeof object.textFlexSettingArrayList[i] === "string")
            message.textFlexSettingArrayList[i] = parseInt(object.textFlexSettingArrayList[i], 10);
          else if (typeof object.textFlexSettingArrayList[i] === "number")
            message.textFlexSettingArrayList[i] = object.textFlexSettingArrayList[i];
          else if (typeof object.textFlexSettingArrayList[i] === "object")
            message.textFlexSettingArrayList[i] = new $util.LongBits(
              object.textFlexSettingArrayList[i].low >>> 0,
              object.textFlexSettingArrayList[i].high >>> 0,
            ).toNumber(true);
      }
      if (object.centerAnimAssetId != null)
        if ($util.Long)
          (message.centerAnimAssetId = $util.Long.fromValue(object.centerAnimAssetId)).unsigned =
            true;
        else if (typeof object.centerAnimAssetId === "string")
          message.centerAnimAssetId = parseInt(object.centerAnimAssetId, 10);
        else if (typeof object.centerAnimAssetId === "number")
          message.centerAnimAssetId = object.centerAnimAssetId;
        else if (typeof object.centerAnimAssetId === "object")
          message.centerAnimAssetId = new $util.LongBits(
            object.centerAnimAssetId.low >>> 0,
            object.centerAnimAssetId.high >>> 0,
          ).toNumber(true);
      if (object.dynamicImage != null) {
        if (typeof object.dynamicImage !== "object")
          throw TypeError(".douyin.EffectConfig.dynamicImage: object expected");
        message.dynamicImage = $root.douyin.Image.fromObject(object.dynamicImage);
      }
      if (object.extraMap) {
        if (typeof object.extraMap !== "object")
          throw TypeError(".douyin.EffectConfig.extraMap: object expected");
        message.extraMap = {};
        for (let keys = Object.keys(object.extraMap), i = 0; i < keys.length; ++i)
          message.extraMap[keys[i]] = String(object.extraMap[keys[i]]);
      }
      if (object.mp4AnimAssetId != null)
        if ($util.Long)
          (message.mp4AnimAssetId = $util.Long.fromValue(object.mp4AnimAssetId)).unsigned = true;
        else if (typeof object.mp4AnimAssetId === "string")
          message.mp4AnimAssetId = parseInt(object.mp4AnimAssetId, 10);
        else if (typeof object.mp4AnimAssetId === "number")
          message.mp4AnimAssetId = object.mp4AnimAssetId;
        else if (typeof object.mp4AnimAssetId === "object")
          message.mp4AnimAssetId = new $util.LongBits(
            object.mp4AnimAssetId.low >>> 0,
            object.mp4AnimAssetId.high >>> 0,
          ).toNumber(true);
      if (object.priority != null)
        if ($util.Long) (message.priority = $util.Long.fromValue(object.priority)).unsigned = true;
        else if (typeof object.priority === "string")
          message.priority = parseInt(object.priority, 10);
        else if (typeof object.priority === "number") message.priority = object.priority;
        else if (typeof object.priority === "object")
          message.priority = new $util.LongBits(
            object.priority.low >>> 0,
            object.priority.high >>> 0,
          ).toNumber(true);
      if (object.maxWaitTime != null)
        if ($util.Long)
          (message.maxWaitTime = $util.Long.fromValue(object.maxWaitTime)).unsigned = true;
        else if (typeof object.maxWaitTime === "string")
          message.maxWaitTime = parseInt(object.maxWaitTime, 10);
        else if (typeof object.maxWaitTime === "number") message.maxWaitTime = object.maxWaitTime;
        else if (typeof object.maxWaitTime === "object")
          message.maxWaitTime = new $util.LongBits(
            object.maxWaitTime.low >>> 0,
            object.maxWaitTime.high >>> 0,
          ).toNumber(true);
      if (object.dressId != null) message.dressId = String(object.dressId);
      if (object.alignment != null)
        if ($util.Long)
          (message.alignment = $util.Long.fromValue(object.alignment)).unsigned = true;
        else if (typeof object.alignment === "string")
          message.alignment = parseInt(object.alignment, 10);
        else if (typeof object.alignment === "number") message.alignment = object.alignment;
        else if (typeof object.alignment === "object")
          message.alignment = new $util.LongBits(
            object.alignment.low >>> 0,
            object.alignment.high >>> 0,
          ).toNumber(true);
      if (object.alignmentOffset != null)
        if ($util.Long)
          (message.alignmentOffset = $util.Long.fromValue(object.alignmentOffset)).unsigned = true;
        else if (typeof object.alignmentOffset === "string")
          message.alignmentOffset = parseInt(object.alignmentOffset, 10);
        else if (typeof object.alignmentOffset === "number")
          message.alignmentOffset = object.alignmentOffset;
        else if (typeof object.alignmentOffset === "object")
          message.alignmentOffset = new $util.LongBits(
            object.alignmentOffset.low >>> 0,
            object.alignmentOffset.high >>> 0,
          ).toNumber(true);
      return message;
    };

    /**
     * Creates a plain object from an EffectConfig message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.EffectConfig
     * @static
     * @param {douyin.EffectConfig} message EffectConfig
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    EffectConfig.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) {
        object.flexSettingArrayList = [];
        object.textFlexSettingArrayList = [];
      }
      if (options.objects || options.defaults) object.extraMap = {};
      if (options.defaults) {
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.type =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.type = options.longs === String ? "0" : 0;
        object.icon = null;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.avatarPos =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.avatarPos = options.longs === String ? "0" : 0;
        object.text = null;
        object.textIcon = null;
        object.stayTime = 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.animAssetId =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.animAssetId = options.longs === String ? "0" : 0;
        object.badge = null;
        object.textIconOverlay = null;
        object.animatedBadge = null;
        object.hasSweepLight = false;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.centerAnimAssetId =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.centerAnimAssetId = options.longs === String ? "0" : 0;
        object.dynamicImage = null;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.mp4AnimAssetId =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.mp4AnimAssetId = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.priority =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.priority = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.maxWaitTime =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.maxWaitTime = options.longs === String ? "0" : 0;
        object.dressId = "";
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.alignment =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.alignment = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.alignmentOffset =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.alignmentOffset = options.longs === String ? "0" : 0;
      }
      if (message.type != null && message.hasOwnProperty("type"))
        if (typeof message.type === "number")
          object.type = options.longs === String ? String(message.type) : message.type;
        else
          object.type =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.type)
              : options.longs === Number
                ? new $util.LongBits(message.type.low >>> 0, message.type.high >>> 0).toNumber(true)
                : message.type;
      if (message.icon != null && message.hasOwnProperty("icon"))
        object.icon = $root.douyin.Image.toObject(message.icon, options);
      if (message.avatarPos != null && message.hasOwnProperty("avatarPos"))
        if (typeof message.avatarPos === "number")
          object.avatarPos =
            options.longs === String ? String(message.avatarPos) : message.avatarPos;
        else
          object.avatarPos =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.avatarPos)
              : options.longs === Number
                ? new $util.LongBits(
                    message.avatarPos.low >>> 0,
                    message.avatarPos.high >>> 0,
                  ).toNumber(true)
                : message.avatarPos;
      if (message.text != null && message.hasOwnProperty("text"))
        object.text = $root.douyin.Text.toObject(message.text, options);
      if (message.textIcon != null && message.hasOwnProperty("textIcon"))
        object.textIcon = $root.douyin.Image.toObject(message.textIcon, options);
      if (message.stayTime != null && message.hasOwnProperty("stayTime"))
        object.stayTime = message.stayTime;
      if (message.animAssetId != null && message.hasOwnProperty("animAssetId"))
        if (typeof message.animAssetId === "number")
          object.animAssetId =
            options.longs === String ? String(message.animAssetId) : message.animAssetId;
        else
          object.animAssetId =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.animAssetId)
              : options.longs === Number
                ? new $util.LongBits(
                    message.animAssetId.low >>> 0,
                    message.animAssetId.high >>> 0,
                  ).toNumber(true)
                : message.animAssetId;
      if (message.badge != null && message.hasOwnProperty("badge"))
        object.badge = $root.douyin.Image.toObject(message.badge, options);
      if (message.flexSettingArrayList && message.flexSettingArrayList.length) {
        object.flexSettingArrayList = [];
        for (let j = 0; j < message.flexSettingArrayList.length; ++j)
          if (typeof message.flexSettingArrayList[j] === "number")
            object.flexSettingArrayList[j] =
              options.longs === String
                ? String(message.flexSettingArrayList[j])
                : message.flexSettingArrayList[j];
          else
            object.flexSettingArrayList[j] =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.flexSettingArrayList[j])
                : options.longs === Number
                  ? new $util.LongBits(
                      message.flexSettingArrayList[j].low >>> 0,
                      message.flexSettingArrayList[j].high >>> 0,
                    ).toNumber(true)
                  : message.flexSettingArrayList[j];
      }
      if (message.textIconOverlay != null && message.hasOwnProperty("textIconOverlay"))
        object.textIconOverlay = $root.douyin.Image.toObject(message.textIconOverlay, options);
      if (message.animatedBadge != null && message.hasOwnProperty("animatedBadge"))
        object.animatedBadge = $root.douyin.Image.toObject(message.animatedBadge, options);
      if (message.hasSweepLight != null && message.hasOwnProperty("hasSweepLight"))
        object.hasSweepLight = message.hasSweepLight;
      if (message.textFlexSettingArrayList && message.textFlexSettingArrayList.length) {
        object.textFlexSettingArrayList = [];
        for (let j = 0; j < message.textFlexSettingArrayList.length; ++j)
          if (typeof message.textFlexSettingArrayList[j] === "number")
            object.textFlexSettingArrayList[j] =
              options.longs === String
                ? String(message.textFlexSettingArrayList[j])
                : message.textFlexSettingArrayList[j];
          else
            object.textFlexSettingArrayList[j] =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.textFlexSettingArrayList[j])
                : options.longs === Number
                  ? new $util.LongBits(
                      message.textFlexSettingArrayList[j].low >>> 0,
                      message.textFlexSettingArrayList[j].high >>> 0,
                    ).toNumber(true)
                  : message.textFlexSettingArrayList[j];
      }
      if (message.centerAnimAssetId != null && message.hasOwnProperty("centerAnimAssetId"))
        if (typeof message.centerAnimAssetId === "number")
          object.centerAnimAssetId =
            options.longs === String
              ? String(message.centerAnimAssetId)
              : message.centerAnimAssetId;
        else
          object.centerAnimAssetId =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.centerAnimAssetId)
              : options.longs === Number
                ? new $util.LongBits(
                    message.centerAnimAssetId.low >>> 0,
                    message.centerAnimAssetId.high >>> 0,
                  ).toNumber(true)
                : message.centerAnimAssetId;
      if (message.dynamicImage != null && message.hasOwnProperty("dynamicImage"))
        object.dynamicImage = $root.douyin.Image.toObject(message.dynamicImage, options);
      let keys2;
      if (message.extraMap && (keys2 = Object.keys(message.extraMap)).length) {
        object.extraMap = {};
        for (let j = 0; j < keys2.length; ++j)
          object.extraMap[keys2[j]] = message.extraMap[keys2[j]];
      }
      if (message.mp4AnimAssetId != null && message.hasOwnProperty("mp4AnimAssetId"))
        if (typeof message.mp4AnimAssetId === "number")
          object.mp4AnimAssetId =
            options.longs === String ? String(message.mp4AnimAssetId) : message.mp4AnimAssetId;
        else
          object.mp4AnimAssetId =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.mp4AnimAssetId)
              : options.longs === Number
                ? new $util.LongBits(
                    message.mp4AnimAssetId.low >>> 0,
                    message.mp4AnimAssetId.high >>> 0,
                  ).toNumber(true)
                : message.mp4AnimAssetId;
      if (message.priority != null && message.hasOwnProperty("priority"))
        if (typeof message.priority === "number")
          object.priority = options.longs === String ? String(message.priority) : message.priority;
        else
          object.priority =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.priority)
              : options.longs === Number
                ? new $util.LongBits(
                    message.priority.low >>> 0,
                    message.priority.high >>> 0,
                  ).toNumber(true)
                : message.priority;
      if (message.maxWaitTime != null && message.hasOwnProperty("maxWaitTime"))
        if (typeof message.maxWaitTime === "number")
          object.maxWaitTime =
            options.longs === String ? String(message.maxWaitTime) : message.maxWaitTime;
        else
          object.maxWaitTime =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.maxWaitTime)
              : options.longs === Number
                ? new $util.LongBits(
                    message.maxWaitTime.low >>> 0,
                    message.maxWaitTime.high >>> 0,
                  ).toNumber(true)
                : message.maxWaitTime;
      if (message.dressId != null && message.hasOwnProperty("dressId"))
        object.dressId = message.dressId;
      if (message.alignment != null && message.hasOwnProperty("alignment"))
        if (typeof message.alignment === "number")
          object.alignment =
            options.longs === String ? String(message.alignment) : message.alignment;
        else
          object.alignment =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.alignment)
              : options.longs === Number
                ? new $util.LongBits(
                    message.alignment.low >>> 0,
                    message.alignment.high >>> 0,
                  ).toNumber(true)
                : message.alignment;
      if (message.alignmentOffset != null && message.hasOwnProperty("alignmentOffset"))
        if (typeof message.alignmentOffset === "number")
          object.alignmentOffset =
            options.longs === String ? String(message.alignmentOffset) : message.alignmentOffset;
        else
          object.alignmentOffset =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.alignmentOffset)
              : options.longs === Number
                ? new $util.LongBits(
                    message.alignmentOffset.low >>> 0,
                    message.alignmentOffset.high >>> 0,
                  ).toNumber(true)
                : message.alignmentOffset;
      return object;
    };

    /**
     * Converts this EffectConfig to JSON.
     * @function toJSON
     * @memberof douyin.EffectConfig
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    EffectConfig.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for EffectConfig
     * @function getTypeUrl
     * @memberof douyin.EffectConfig
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    EffectConfig.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.EffectConfig";
    };

    return EffectConfig;
  })();

  douyin.Text = (function () {
    /**
     * Properties of a Text.
     * @memberof douyin
     * @interface IText
     * @property {string|null} [key] Text key
     * @property {string|null} [defaultPatter] Text defaultPatter
     * @property {douyin.ITextFormat|null} [defaultFormat] Text defaultFormat
     * @property {Array.<douyin.ITextPiece>|null} [piecesList] Text piecesList
     */

    /**
     * Constructs a new Text.
     * @memberof douyin
     * @classdesc Represents a Text.
     * @implements IText
     * @constructor
     * @param {douyin.IText=} [properties] Properties to set
     */
    function Text(properties) {
      this.piecesList = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * Text key.
     * @member {string} key
     * @memberof douyin.Text
     * @instance
     */
    Text.prototype.key = "";

    /**
     * Text defaultPatter.
     * @member {string} defaultPatter
     * @memberof douyin.Text
     * @instance
     */
    Text.prototype.defaultPatter = "";

    /**
     * Text defaultFormat.
     * @member {douyin.ITextFormat|null|undefined} defaultFormat
     * @memberof douyin.Text
     * @instance
     */
    Text.prototype.defaultFormat = null;

    /**
     * Text piecesList.
     * @member {Array.<douyin.ITextPiece>} piecesList
     * @memberof douyin.Text
     * @instance
     */
    Text.prototype.piecesList = $util.emptyArray;

    /**
     * Creates a new Text instance using the specified properties.
     * @function create
     * @memberof douyin.Text
     * @static
     * @param {douyin.IText=} [properties] Properties to set
     * @returns {douyin.Text} Text instance
     */
    Text.create = function create(properties) {
      return new Text(properties);
    };

    /**
     * Encodes the specified Text message. Does not implicitly {@link douyin.Text.verify|verify} messages.
     * @function encode
     * @memberof douyin.Text
     * @static
     * @param {douyin.IText} message Text message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Text.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.key != null && Object.hasOwnProperty.call(message, "key"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.key);
      if (message.defaultPatter != null && Object.hasOwnProperty.call(message, "defaultPatter"))
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.defaultPatter);
      if (message.defaultFormat != null && Object.hasOwnProperty.call(message, "defaultFormat"))
        $root.douyin.TextFormat.encode(
          message.defaultFormat,
          writer.uint32(/* id 3, wireType 2 =*/ 26).fork(),
        ).ldelim();
      if (message.piecesList != null && message.piecesList.length)
        for (let i = 0; i < message.piecesList.length; ++i)
          $root.douyin.TextPiece.encode(
            message.piecesList[i],
            writer.uint32(/* id 4, wireType 2 =*/ 34).fork(),
          ).ldelim();
      return writer;
    };

    /**
     * Encodes the specified Text message, length delimited. Does not implicitly {@link douyin.Text.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.Text
     * @static
     * @param {douyin.IText} message Text message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Text.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a Text message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.Text
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.Text} Text
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Text.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.Text();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.key = reader.string();
            break;
          }
          case 2: {
            message.defaultPatter = reader.string();
            break;
          }
          case 3: {
            message.defaultFormat = $root.douyin.TextFormat.decode(reader, reader.uint32());
            break;
          }
          case 4: {
            if (!(message.piecesList && message.piecesList.length)) message.piecesList = [];
            message.piecesList.push($root.douyin.TextPiece.decode(reader, reader.uint32()));
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a Text message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.Text
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.Text} Text
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Text.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a Text message.
     * @function verify
     * @memberof douyin.Text
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Text.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.key != null && message.hasOwnProperty("key"))
        if (!$util.isString(message.key)) return "key: string expected";
      if (message.defaultPatter != null && message.hasOwnProperty("defaultPatter"))
        if (!$util.isString(message.defaultPatter)) return "defaultPatter: string expected";
      if (message.defaultFormat != null && message.hasOwnProperty("defaultFormat")) {
        let error = $root.douyin.TextFormat.verify(message.defaultFormat);
        if (error) return "defaultFormat." + error;
      }
      if (message.piecesList != null && message.hasOwnProperty("piecesList")) {
        if (!Array.isArray(message.piecesList)) return "piecesList: array expected";
        for (let i = 0; i < message.piecesList.length; ++i) {
          let error = $root.douyin.TextPiece.verify(message.piecesList[i]);
          if (error) return "piecesList." + error;
        }
      }
      return null;
    };

    /**
     * Creates a Text message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.Text
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.Text} Text
     */
    Text.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.Text) return object;
      let message = new $root.douyin.Text();
      if (object.key != null) message.key = String(object.key);
      if (object.defaultPatter != null) message.defaultPatter = String(object.defaultPatter);
      if (object.defaultFormat != null) {
        if (typeof object.defaultFormat !== "object")
          throw TypeError(".douyin.Text.defaultFormat: object expected");
        message.defaultFormat = $root.douyin.TextFormat.fromObject(object.defaultFormat);
      }
      if (object.piecesList) {
        if (!Array.isArray(object.piecesList))
          throw TypeError(".douyin.Text.piecesList: array expected");
        message.piecesList = [];
        for (let i = 0; i < object.piecesList.length; ++i) {
          if (typeof object.piecesList[i] !== "object")
            throw TypeError(".douyin.Text.piecesList: object expected");
          message.piecesList[i] = $root.douyin.TextPiece.fromObject(object.piecesList[i]);
        }
      }
      return message;
    };

    /**
     * Creates a plain object from a Text message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.Text
     * @static
     * @param {douyin.Text} message Text
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Text.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.piecesList = [];
      if (options.defaults) {
        object.key = "";
        object.defaultPatter = "";
        object.defaultFormat = null;
      }
      if (message.key != null && message.hasOwnProperty("key")) object.key = message.key;
      if (message.defaultPatter != null && message.hasOwnProperty("defaultPatter"))
        object.defaultPatter = message.defaultPatter;
      if (message.defaultFormat != null && message.hasOwnProperty("defaultFormat"))
        object.defaultFormat = $root.douyin.TextFormat.toObject(message.defaultFormat, options);
      if (message.piecesList && message.piecesList.length) {
        object.piecesList = [];
        for (let j = 0; j < message.piecesList.length; ++j)
          object.piecesList[j] = $root.douyin.TextPiece.toObject(message.piecesList[j], options);
      }
      return object;
    };

    /**
     * Converts this Text to JSON.
     * @function toJSON
     * @memberof douyin.Text
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Text.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Text
     * @function getTypeUrl
     * @memberof douyin.Text
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Text.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.Text";
    };

    return Text;
  })();

  douyin.TextPiece = (function () {
    /**
     * Properties of a TextPiece.
     * @memberof douyin
     * @interface ITextPiece
     * @property {boolean|null} [type] TextPiece type
     * @property {douyin.ITextFormat|null} [format] TextPiece format
     * @property {string|null} [stringValue] TextPiece stringValue
     * @property {douyin.ITextPieceUser|null} [userValue] TextPiece userValue
     * @property {douyin.ITextPieceGift|null} [giftValue] TextPiece giftValue
     * @property {douyin.ITextPieceHeart|null} [heartValue] TextPiece heartValue
     * @property {douyin.ITextPiecePatternRef|null} [patternRefValue] TextPiece patternRefValue
     * @property {douyin.ITextPieceImage|null} [imageValue] TextPiece imageValue
     */

    /**
     * Constructs a new TextPiece.
     * @memberof douyin
     * @classdesc Represents a TextPiece.
     * @implements ITextPiece
     * @constructor
     * @param {douyin.ITextPiece=} [properties] Properties to set
     */
    function TextPiece(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * TextPiece type.
     * @member {boolean} type
     * @memberof douyin.TextPiece
     * @instance
     */
    TextPiece.prototype.type = false;

    /**
     * TextPiece format.
     * @member {douyin.ITextFormat|null|undefined} format
     * @memberof douyin.TextPiece
     * @instance
     */
    TextPiece.prototype.format = null;

    /**
     * TextPiece stringValue.
     * @member {string} stringValue
     * @memberof douyin.TextPiece
     * @instance
     */
    TextPiece.prototype.stringValue = "";

    /**
     * TextPiece userValue.
     * @member {douyin.ITextPieceUser|null|undefined} userValue
     * @memberof douyin.TextPiece
     * @instance
     */
    TextPiece.prototype.userValue = null;

    /**
     * TextPiece giftValue.
     * @member {douyin.ITextPieceGift|null|undefined} giftValue
     * @memberof douyin.TextPiece
     * @instance
     */
    TextPiece.prototype.giftValue = null;

    /**
     * TextPiece heartValue.
     * @member {douyin.ITextPieceHeart|null|undefined} heartValue
     * @memberof douyin.TextPiece
     * @instance
     */
    TextPiece.prototype.heartValue = null;

    /**
     * TextPiece patternRefValue.
     * @member {douyin.ITextPiecePatternRef|null|undefined} patternRefValue
     * @memberof douyin.TextPiece
     * @instance
     */
    TextPiece.prototype.patternRefValue = null;

    /**
     * TextPiece imageValue.
     * @member {douyin.ITextPieceImage|null|undefined} imageValue
     * @memberof douyin.TextPiece
     * @instance
     */
    TextPiece.prototype.imageValue = null;

    /**
     * Creates a new TextPiece instance using the specified properties.
     * @function create
     * @memberof douyin.TextPiece
     * @static
     * @param {douyin.ITextPiece=} [properties] Properties to set
     * @returns {douyin.TextPiece} TextPiece instance
     */
    TextPiece.create = function create(properties) {
      return new TextPiece(properties);
    };

    /**
     * Encodes the specified TextPiece message. Does not implicitly {@link douyin.TextPiece.verify|verify} messages.
     * @function encode
     * @memberof douyin.TextPiece
     * @static
     * @param {douyin.ITextPiece} message TextPiece message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TextPiece.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.type != null && Object.hasOwnProperty.call(message, "type"))
        writer.uint32(/* id 1, wireType 0 =*/ 8).bool(message.type);
      if (message.format != null && Object.hasOwnProperty.call(message, "format"))
        $root.douyin.TextFormat.encode(
          message.format,
          writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
        ).ldelim();
      if (message.stringValue != null && Object.hasOwnProperty.call(message, "stringValue"))
        writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.stringValue);
      if (message.userValue != null && Object.hasOwnProperty.call(message, "userValue"))
        $root.douyin.TextPieceUser.encode(
          message.userValue,
          writer.uint32(/* id 4, wireType 2 =*/ 34).fork(),
        ).ldelim();
      if (message.giftValue != null && Object.hasOwnProperty.call(message, "giftValue"))
        $root.douyin.TextPieceGift.encode(
          message.giftValue,
          writer.uint32(/* id 5, wireType 2 =*/ 42).fork(),
        ).ldelim();
      if (message.heartValue != null && Object.hasOwnProperty.call(message, "heartValue"))
        $root.douyin.TextPieceHeart.encode(
          message.heartValue,
          writer.uint32(/* id 6, wireType 2 =*/ 50).fork(),
        ).ldelim();
      if (message.patternRefValue != null && Object.hasOwnProperty.call(message, "patternRefValue"))
        $root.douyin.TextPiecePatternRef.encode(
          message.patternRefValue,
          writer.uint32(/* id 7, wireType 2 =*/ 58).fork(),
        ).ldelim();
      if (message.imageValue != null && Object.hasOwnProperty.call(message, "imageValue"))
        $root.douyin.TextPieceImage.encode(
          message.imageValue,
          writer.uint32(/* id 8, wireType 2 =*/ 66).fork(),
        ).ldelim();
      return writer;
    };

    /**
     * Encodes the specified TextPiece message, length delimited. Does not implicitly {@link douyin.TextPiece.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.TextPiece
     * @static
     * @param {douyin.ITextPiece} message TextPiece message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TextPiece.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a TextPiece message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.TextPiece
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.TextPiece} TextPiece
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TextPiece.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.TextPiece();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.type = reader.bool();
            break;
          }
          case 2: {
            message.format = $root.douyin.TextFormat.decode(reader, reader.uint32());
            break;
          }
          case 3: {
            message.stringValue = reader.string();
            break;
          }
          case 4: {
            message.userValue = $root.douyin.TextPieceUser.decode(reader, reader.uint32());
            break;
          }
          case 5: {
            message.giftValue = $root.douyin.TextPieceGift.decode(reader, reader.uint32());
            break;
          }
          case 6: {
            message.heartValue = $root.douyin.TextPieceHeart.decode(reader, reader.uint32());
            break;
          }
          case 7: {
            message.patternRefValue = $root.douyin.TextPiecePatternRef.decode(
              reader,
              reader.uint32(),
            );
            break;
          }
          case 8: {
            message.imageValue = $root.douyin.TextPieceImage.decode(reader, reader.uint32());
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a TextPiece message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.TextPiece
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.TextPiece} TextPiece
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TextPiece.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a TextPiece message.
     * @function verify
     * @memberof douyin.TextPiece
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    TextPiece.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.type != null && message.hasOwnProperty("type"))
        if (typeof message.type !== "boolean") return "type: boolean expected";
      if (message.format != null && message.hasOwnProperty("format")) {
        let error = $root.douyin.TextFormat.verify(message.format);
        if (error) return "format." + error;
      }
      if (message.stringValue != null && message.hasOwnProperty("stringValue"))
        if (!$util.isString(message.stringValue)) return "stringValue: string expected";
      if (message.userValue != null && message.hasOwnProperty("userValue")) {
        let error = $root.douyin.TextPieceUser.verify(message.userValue);
        if (error) return "userValue." + error;
      }
      if (message.giftValue != null && message.hasOwnProperty("giftValue")) {
        let error = $root.douyin.TextPieceGift.verify(message.giftValue);
        if (error) return "giftValue." + error;
      }
      if (message.heartValue != null && message.hasOwnProperty("heartValue")) {
        let error = $root.douyin.TextPieceHeart.verify(message.heartValue);
        if (error) return "heartValue." + error;
      }
      if (message.patternRefValue != null && message.hasOwnProperty("patternRefValue")) {
        let error = $root.douyin.TextPiecePatternRef.verify(message.patternRefValue);
        if (error) return "patternRefValue." + error;
      }
      if (message.imageValue != null && message.hasOwnProperty("imageValue")) {
        let error = $root.douyin.TextPieceImage.verify(message.imageValue);
        if (error) return "imageValue." + error;
      }
      return null;
    };

    /**
     * Creates a TextPiece message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.TextPiece
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.TextPiece} TextPiece
     */
    TextPiece.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.TextPiece) return object;
      let message = new $root.douyin.TextPiece();
      if (object.type != null) message.type = Boolean(object.type);
      if (object.format != null) {
        if (typeof object.format !== "object")
          throw TypeError(".douyin.TextPiece.format: object expected");
        message.format = $root.douyin.TextFormat.fromObject(object.format);
      }
      if (object.stringValue != null) message.stringValue = String(object.stringValue);
      if (object.userValue != null) {
        if (typeof object.userValue !== "object")
          throw TypeError(".douyin.TextPiece.userValue: object expected");
        message.userValue = $root.douyin.TextPieceUser.fromObject(object.userValue);
      }
      if (object.giftValue != null) {
        if (typeof object.giftValue !== "object")
          throw TypeError(".douyin.TextPiece.giftValue: object expected");
        message.giftValue = $root.douyin.TextPieceGift.fromObject(object.giftValue);
      }
      if (object.heartValue != null) {
        if (typeof object.heartValue !== "object")
          throw TypeError(".douyin.TextPiece.heartValue: object expected");
        message.heartValue = $root.douyin.TextPieceHeart.fromObject(object.heartValue);
      }
      if (object.patternRefValue != null) {
        if (typeof object.patternRefValue !== "object")
          throw TypeError(".douyin.TextPiece.patternRefValue: object expected");
        message.patternRefValue = $root.douyin.TextPiecePatternRef.fromObject(
          object.patternRefValue,
        );
      }
      if (object.imageValue != null) {
        if (typeof object.imageValue !== "object")
          throw TypeError(".douyin.TextPiece.imageValue: object expected");
        message.imageValue = $root.douyin.TextPieceImage.fromObject(object.imageValue);
      }
      return message;
    };

    /**
     * Creates a plain object from a TextPiece message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.TextPiece
     * @static
     * @param {douyin.TextPiece} message TextPiece
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    TextPiece.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.type = false;
        object.format = null;
        object.stringValue = "";
        object.userValue = null;
        object.giftValue = null;
        object.heartValue = null;
        object.patternRefValue = null;
        object.imageValue = null;
      }
      if (message.type != null && message.hasOwnProperty("type")) object.type = message.type;
      if (message.format != null && message.hasOwnProperty("format"))
        object.format = $root.douyin.TextFormat.toObject(message.format, options);
      if (message.stringValue != null && message.hasOwnProperty("stringValue"))
        object.stringValue = message.stringValue;
      if (message.userValue != null && message.hasOwnProperty("userValue"))
        object.userValue = $root.douyin.TextPieceUser.toObject(message.userValue, options);
      if (message.giftValue != null && message.hasOwnProperty("giftValue"))
        object.giftValue = $root.douyin.TextPieceGift.toObject(message.giftValue, options);
      if (message.heartValue != null && message.hasOwnProperty("heartValue"))
        object.heartValue = $root.douyin.TextPieceHeart.toObject(message.heartValue, options);
      if (message.patternRefValue != null && message.hasOwnProperty("patternRefValue"))
        object.patternRefValue = $root.douyin.TextPiecePatternRef.toObject(
          message.patternRefValue,
          options,
        );
      if (message.imageValue != null && message.hasOwnProperty("imageValue"))
        object.imageValue = $root.douyin.TextPieceImage.toObject(message.imageValue, options);
      return object;
    };

    /**
     * Converts this TextPiece to JSON.
     * @function toJSON
     * @memberof douyin.TextPiece
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    TextPiece.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for TextPiece
     * @function getTypeUrl
     * @memberof douyin.TextPiece
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    TextPiece.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.TextPiece";
    };

    return TextPiece;
  })();

  douyin.TextPieceImage = (function () {
    /**
     * Properties of a TextPieceImage.
     * @memberof douyin
     * @interface ITextPieceImage
     * @property {douyin.IImage|null} [image] TextPieceImage image
     * @property {number|null} [scalingRate] TextPieceImage scalingRate
     */

    /**
     * Constructs a new TextPieceImage.
     * @memberof douyin
     * @classdesc Represents a TextPieceImage.
     * @implements ITextPieceImage
     * @constructor
     * @param {douyin.ITextPieceImage=} [properties] Properties to set
     */
    function TextPieceImage(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * TextPieceImage image.
     * @member {douyin.IImage|null|undefined} image
     * @memberof douyin.TextPieceImage
     * @instance
     */
    TextPieceImage.prototype.image = null;

    /**
     * TextPieceImage scalingRate.
     * @member {number} scalingRate
     * @memberof douyin.TextPieceImage
     * @instance
     */
    TextPieceImage.prototype.scalingRate = 0;

    /**
     * Creates a new TextPieceImage instance using the specified properties.
     * @function create
     * @memberof douyin.TextPieceImage
     * @static
     * @param {douyin.ITextPieceImage=} [properties] Properties to set
     * @returns {douyin.TextPieceImage} TextPieceImage instance
     */
    TextPieceImage.create = function create(properties) {
      return new TextPieceImage(properties);
    };

    /**
     * Encodes the specified TextPieceImage message. Does not implicitly {@link douyin.TextPieceImage.verify|verify} messages.
     * @function encode
     * @memberof douyin.TextPieceImage
     * @static
     * @param {douyin.ITextPieceImage} message TextPieceImage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TextPieceImage.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.image != null && Object.hasOwnProperty.call(message, "image"))
        $root.douyin.Image.encode(
          message.image,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (message.scalingRate != null && Object.hasOwnProperty.call(message, "scalingRate"))
        writer.uint32(/* id 2, wireType 5 =*/ 21).float(message.scalingRate);
      return writer;
    };

    /**
     * Encodes the specified TextPieceImage message, length delimited. Does not implicitly {@link douyin.TextPieceImage.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.TextPieceImage
     * @static
     * @param {douyin.ITextPieceImage} message TextPieceImage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TextPieceImage.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a TextPieceImage message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.TextPieceImage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.TextPieceImage} TextPieceImage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TextPieceImage.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.TextPieceImage();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.image = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 2: {
            message.scalingRate = reader.float();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a TextPieceImage message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.TextPieceImage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.TextPieceImage} TextPieceImage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TextPieceImage.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a TextPieceImage message.
     * @function verify
     * @memberof douyin.TextPieceImage
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    TextPieceImage.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.image != null && message.hasOwnProperty("image")) {
        let error = $root.douyin.Image.verify(message.image);
        if (error) return "image." + error;
      }
      if (message.scalingRate != null && message.hasOwnProperty("scalingRate"))
        if (typeof message.scalingRate !== "number") return "scalingRate: number expected";
      return null;
    };

    /**
     * Creates a TextPieceImage message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.TextPieceImage
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.TextPieceImage} TextPieceImage
     */
    TextPieceImage.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.TextPieceImage) return object;
      let message = new $root.douyin.TextPieceImage();
      if (object.image != null) {
        if (typeof object.image !== "object")
          throw TypeError(".douyin.TextPieceImage.image: object expected");
        message.image = $root.douyin.Image.fromObject(object.image);
      }
      if (object.scalingRate != null) message.scalingRate = Number(object.scalingRate);
      return message;
    };

    /**
     * Creates a plain object from a TextPieceImage message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.TextPieceImage
     * @static
     * @param {douyin.TextPieceImage} message TextPieceImage
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    TextPieceImage.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.image = null;
        object.scalingRate = 0;
      }
      if (message.image != null && message.hasOwnProperty("image"))
        object.image = $root.douyin.Image.toObject(message.image, options);
      if (message.scalingRate != null && message.hasOwnProperty("scalingRate"))
        object.scalingRate =
          options.json && !isFinite(message.scalingRate)
            ? String(message.scalingRate)
            : message.scalingRate;
      return object;
    };

    /**
     * Converts this TextPieceImage to JSON.
     * @function toJSON
     * @memberof douyin.TextPieceImage
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    TextPieceImage.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for TextPieceImage
     * @function getTypeUrl
     * @memberof douyin.TextPieceImage
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    TextPieceImage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.TextPieceImage";
    };

    return TextPieceImage;
  })();

  douyin.TextPiecePatternRef = (function () {
    /**
     * Properties of a TextPiecePatternRef.
     * @memberof douyin
     * @interface ITextPiecePatternRef
     * @property {string|null} [key] TextPiecePatternRef key
     * @property {string|null} [defaultPattern] TextPiecePatternRef defaultPattern
     */

    /**
     * Constructs a new TextPiecePatternRef.
     * @memberof douyin
     * @classdesc Represents a TextPiecePatternRef.
     * @implements ITextPiecePatternRef
     * @constructor
     * @param {douyin.ITextPiecePatternRef=} [properties] Properties to set
     */
    function TextPiecePatternRef(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * TextPiecePatternRef key.
     * @member {string} key
     * @memberof douyin.TextPiecePatternRef
     * @instance
     */
    TextPiecePatternRef.prototype.key = "";

    /**
     * TextPiecePatternRef defaultPattern.
     * @member {string} defaultPattern
     * @memberof douyin.TextPiecePatternRef
     * @instance
     */
    TextPiecePatternRef.prototype.defaultPattern = "";

    /**
     * Creates a new TextPiecePatternRef instance using the specified properties.
     * @function create
     * @memberof douyin.TextPiecePatternRef
     * @static
     * @param {douyin.ITextPiecePatternRef=} [properties] Properties to set
     * @returns {douyin.TextPiecePatternRef} TextPiecePatternRef instance
     */
    TextPiecePatternRef.create = function create(properties) {
      return new TextPiecePatternRef(properties);
    };

    /**
     * Encodes the specified TextPiecePatternRef message. Does not implicitly {@link douyin.TextPiecePatternRef.verify|verify} messages.
     * @function encode
     * @memberof douyin.TextPiecePatternRef
     * @static
     * @param {douyin.ITextPiecePatternRef} message TextPiecePatternRef message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TextPiecePatternRef.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.key != null && Object.hasOwnProperty.call(message, "key"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.key);
      if (message.defaultPattern != null && Object.hasOwnProperty.call(message, "defaultPattern"))
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.defaultPattern);
      return writer;
    };

    /**
     * Encodes the specified TextPiecePatternRef message, length delimited. Does not implicitly {@link douyin.TextPiecePatternRef.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.TextPiecePatternRef
     * @static
     * @param {douyin.ITextPiecePatternRef} message TextPiecePatternRef message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TextPiecePatternRef.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a TextPiecePatternRef message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.TextPiecePatternRef
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.TextPiecePatternRef} TextPiecePatternRef
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TextPiecePatternRef.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.TextPiecePatternRef();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.key = reader.string();
            break;
          }
          case 2: {
            message.defaultPattern = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a TextPiecePatternRef message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.TextPiecePatternRef
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.TextPiecePatternRef} TextPiecePatternRef
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TextPiecePatternRef.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a TextPiecePatternRef message.
     * @function verify
     * @memberof douyin.TextPiecePatternRef
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    TextPiecePatternRef.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.key != null && message.hasOwnProperty("key"))
        if (!$util.isString(message.key)) return "key: string expected";
      if (message.defaultPattern != null && message.hasOwnProperty("defaultPattern"))
        if (!$util.isString(message.defaultPattern)) return "defaultPattern: string expected";
      return null;
    };

    /**
     * Creates a TextPiecePatternRef message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.TextPiecePatternRef
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.TextPiecePatternRef} TextPiecePatternRef
     */
    TextPiecePatternRef.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.TextPiecePatternRef) return object;
      let message = new $root.douyin.TextPiecePatternRef();
      if (object.key != null) message.key = String(object.key);
      if (object.defaultPattern != null) message.defaultPattern = String(object.defaultPattern);
      return message;
    };

    /**
     * Creates a plain object from a TextPiecePatternRef message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.TextPiecePatternRef
     * @static
     * @param {douyin.TextPiecePatternRef} message TextPiecePatternRef
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    TextPiecePatternRef.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.key = "";
        object.defaultPattern = "";
      }
      if (message.key != null && message.hasOwnProperty("key")) object.key = message.key;
      if (message.defaultPattern != null && message.hasOwnProperty("defaultPattern"))
        object.defaultPattern = message.defaultPattern;
      return object;
    };

    /**
     * Converts this TextPiecePatternRef to JSON.
     * @function toJSON
     * @memberof douyin.TextPiecePatternRef
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    TextPiecePatternRef.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for TextPiecePatternRef
     * @function getTypeUrl
     * @memberof douyin.TextPiecePatternRef
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    TextPiecePatternRef.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.TextPiecePatternRef";
    };

    return TextPiecePatternRef;
  })();

  douyin.TextPieceHeart = (function () {
    /**
     * Properties of a TextPieceHeart.
     * @memberof douyin
     * @interface ITextPieceHeart
     * @property {string|null} [color] TextPieceHeart color
     */

    /**
     * Constructs a new TextPieceHeart.
     * @memberof douyin
     * @classdesc Represents a TextPieceHeart.
     * @implements ITextPieceHeart
     * @constructor
     * @param {douyin.ITextPieceHeart=} [properties] Properties to set
     */
    function TextPieceHeart(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * TextPieceHeart color.
     * @member {string} color
     * @memberof douyin.TextPieceHeart
     * @instance
     */
    TextPieceHeart.prototype.color = "";

    /**
     * Creates a new TextPieceHeart instance using the specified properties.
     * @function create
     * @memberof douyin.TextPieceHeart
     * @static
     * @param {douyin.ITextPieceHeart=} [properties] Properties to set
     * @returns {douyin.TextPieceHeart} TextPieceHeart instance
     */
    TextPieceHeart.create = function create(properties) {
      return new TextPieceHeart(properties);
    };

    /**
     * Encodes the specified TextPieceHeart message. Does not implicitly {@link douyin.TextPieceHeart.verify|verify} messages.
     * @function encode
     * @memberof douyin.TextPieceHeart
     * @static
     * @param {douyin.ITextPieceHeart} message TextPieceHeart message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TextPieceHeart.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.color != null && Object.hasOwnProperty.call(message, "color"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.color);
      return writer;
    };

    /**
     * Encodes the specified TextPieceHeart message, length delimited. Does not implicitly {@link douyin.TextPieceHeart.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.TextPieceHeart
     * @static
     * @param {douyin.ITextPieceHeart} message TextPieceHeart message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TextPieceHeart.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a TextPieceHeart message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.TextPieceHeart
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.TextPieceHeart} TextPieceHeart
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TextPieceHeart.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.TextPieceHeart();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.color = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a TextPieceHeart message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.TextPieceHeart
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.TextPieceHeart} TextPieceHeart
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TextPieceHeart.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a TextPieceHeart message.
     * @function verify
     * @memberof douyin.TextPieceHeart
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    TextPieceHeart.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.color != null && message.hasOwnProperty("color"))
        if (!$util.isString(message.color)) return "color: string expected";
      return null;
    };

    /**
     * Creates a TextPieceHeart message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.TextPieceHeart
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.TextPieceHeart} TextPieceHeart
     */
    TextPieceHeart.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.TextPieceHeart) return object;
      let message = new $root.douyin.TextPieceHeart();
      if (object.color != null) message.color = String(object.color);
      return message;
    };

    /**
     * Creates a plain object from a TextPieceHeart message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.TextPieceHeart
     * @static
     * @param {douyin.TextPieceHeart} message TextPieceHeart
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    TextPieceHeart.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) object.color = "";
      if (message.color != null && message.hasOwnProperty("color")) object.color = message.color;
      return object;
    };

    /**
     * Converts this TextPieceHeart to JSON.
     * @function toJSON
     * @memberof douyin.TextPieceHeart
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    TextPieceHeart.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for TextPieceHeart
     * @function getTypeUrl
     * @memberof douyin.TextPieceHeart
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    TextPieceHeart.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.TextPieceHeart";
    };

    return TextPieceHeart;
  })();

  douyin.TextPieceGift = (function () {
    /**
     * Properties of a TextPieceGift.
     * @memberof douyin
     * @interface ITextPieceGift
     * @property {number|Long|null} [giftId] TextPieceGift giftId
     * @property {douyin.IPatternRef|null} [nameRef] TextPieceGift nameRef
     */

    /**
     * Constructs a new TextPieceGift.
     * @memberof douyin
     * @classdesc Represents a TextPieceGift.
     * @implements ITextPieceGift
     * @constructor
     * @param {douyin.ITextPieceGift=} [properties] Properties to set
     */
    function TextPieceGift(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * TextPieceGift giftId.
     * @member {number|Long} giftId
     * @memberof douyin.TextPieceGift
     * @instance
     */
    TextPieceGift.prototype.giftId = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * TextPieceGift nameRef.
     * @member {douyin.IPatternRef|null|undefined} nameRef
     * @memberof douyin.TextPieceGift
     * @instance
     */
    TextPieceGift.prototype.nameRef = null;

    /**
     * Creates a new TextPieceGift instance using the specified properties.
     * @function create
     * @memberof douyin.TextPieceGift
     * @static
     * @param {douyin.ITextPieceGift=} [properties] Properties to set
     * @returns {douyin.TextPieceGift} TextPieceGift instance
     */
    TextPieceGift.create = function create(properties) {
      return new TextPieceGift(properties);
    };

    /**
     * Encodes the specified TextPieceGift message. Does not implicitly {@link douyin.TextPieceGift.verify|verify} messages.
     * @function encode
     * @memberof douyin.TextPieceGift
     * @static
     * @param {douyin.ITextPieceGift} message TextPieceGift message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TextPieceGift.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.giftId != null && Object.hasOwnProperty.call(message, "giftId"))
        writer.uint32(/* id 1, wireType 0 =*/ 8).uint64(message.giftId);
      if (message.nameRef != null && Object.hasOwnProperty.call(message, "nameRef"))
        $root.douyin.PatternRef.encode(
          message.nameRef,
          writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
        ).ldelim();
      return writer;
    };

    /**
     * Encodes the specified TextPieceGift message, length delimited. Does not implicitly {@link douyin.TextPieceGift.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.TextPieceGift
     * @static
     * @param {douyin.ITextPieceGift} message TextPieceGift message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TextPieceGift.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a TextPieceGift message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.TextPieceGift
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.TextPieceGift} TextPieceGift
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TextPieceGift.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.TextPieceGift();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.giftId = reader.uint64();
            break;
          }
          case 2: {
            message.nameRef = $root.douyin.PatternRef.decode(reader, reader.uint32());
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a TextPieceGift message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.TextPieceGift
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.TextPieceGift} TextPieceGift
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TextPieceGift.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a TextPieceGift message.
     * @function verify
     * @memberof douyin.TextPieceGift
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    TextPieceGift.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.giftId != null && message.hasOwnProperty("giftId"))
        if (
          !$util.isInteger(message.giftId) &&
          !(
            message.giftId &&
            $util.isInteger(message.giftId.low) &&
            $util.isInteger(message.giftId.high)
          )
        )
          return "giftId: integer|Long expected";
      if (message.nameRef != null && message.hasOwnProperty("nameRef")) {
        let error = $root.douyin.PatternRef.verify(message.nameRef);
        if (error) return "nameRef." + error;
      }
      return null;
    };

    /**
     * Creates a TextPieceGift message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.TextPieceGift
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.TextPieceGift} TextPieceGift
     */
    TextPieceGift.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.TextPieceGift) return object;
      let message = new $root.douyin.TextPieceGift();
      if (object.giftId != null)
        if ($util.Long) (message.giftId = $util.Long.fromValue(object.giftId)).unsigned = true;
        else if (typeof object.giftId === "string") message.giftId = parseInt(object.giftId, 10);
        else if (typeof object.giftId === "number") message.giftId = object.giftId;
        else if (typeof object.giftId === "object")
          message.giftId = new $util.LongBits(
            object.giftId.low >>> 0,
            object.giftId.high >>> 0,
          ).toNumber(true);
      if (object.nameRef != null) {
        if (typeof object.nameRef !== "object")
          throw TypeError(".douyin.TextPieceGift.nameRef: object expected");
        message.nameRef = $root.douyin.PatternRef.fromObject(object.nameRef);
      }
      return message;
    };

    /**
     * Creates a plain object from a TextPieceGift message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.TextPieceGift
     * @static
     * @param {douyin.TextPieceGift} message TextPieceGift
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    TextPieceGift.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.giftId =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.giftId = options.longs === String ? "0" : 0;
        object.nameRef = null;
      }
      if (message.giftId != null && message.hasOwnProperty("giftId"))
        if (typeof message.giftId === "number")
          object.giftId = options.longs === String ? String(message.giftId) : message.giftId;
        else
          object.giftId =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.giftId)
              : options.longs === Number
                ? new $util.LongBits(message.giftId.low >>> 0, message.giftId.high >>> 0).toNumber(
                    true,
                  )
                : message.giftId;
      if (message.nameRef != null && message.hasOwnProperty("nameRef"))
        object.nameRef = $root.douyin.PatternRef.toObject(message.nameRef, options);
      return object;
    };

    /**
     * Converts this TextPieceGift to JSON.
     * @function toJSON
     * @memberof douyin.TextPieceGift
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    TextPieceGift.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for TextPieceGift
     * @function getTypeUrl
     * @memberof douyin.TextPieceGift
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    TextPieceGift.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.TextPieceGift";
    };

    return TextPieceGift;
  })();

  douyin.PatternRef = (function () {
    /**
     * Properties of a PatternRef.
     * @memberof douyin
     * @interface IPatternRef
     * @property {string|null} [key] PatternRef key
     * @property {string|null} [defaultPattern] PatternRef defaultPattern
     */

    /**
     * Constructs a new PatternRef.
     * @memberof douyin
     * @classdesc Represents a PatternRef.
     * @implements IPatternRef
     * @constructor
     * @param {douyin.IPatternRef=} [properties] Properties to set
     */
    function PatternRef(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * PatternRef key.
     * @member {string} key
     * @memberof douyin.PatternRef
     * @instance
     */
    PatternRef.prototype.key = "";

    /**
     * PatternRef defaultPattern.
     * @member {string} defaultPattern
     * @memberof douyin.PatternRef
     * @instance
     */
    PatternRef.prototype.defaultPattern = "";

    /**
     * Creates a new PatternRef instance using the specified properties.
     * @function create
     * @memberof douyin.PatternRef
     * @static
     * @param {douyin.IPatternRef=} [properties] Properties to set
     * @returns {douyin.PatternRef} PatternRef instance
     */
    PatternRef.create = function create(properties) {
      return new PatternRef(properties);
    };

    /**
     * Encodes the specified PatternRef message. Does not implicitly {@link douyin.PatternRef.verify|verify} messages.
     * @function encode
     * @memberof douyin.PatternRef
     * @static
     * @param {douyin.IPatternRef} message PatternRef message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PatternRef.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.key != null && Object.hasOwnProperty.call(message, "key"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.key);
      if (message.defaultPattern != null && Object.hasOwnProperty.call(message, "defaultPattern"))
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.defaultPattern);
      return writer;
    };

    /**
     * Encodes the specified PatternRef message, length delimited. Does not implicitly {@link douyin.PatternRef.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.PatternRef
     * @static
     * @param {douyin.IPatternRef} message PatternRef message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PatternRef.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a PatternRef message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.PatternRef
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.PatternRef} PatternRef
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PatternRef.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.PatternRef();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.key = reader.string();
            break;
          }
          case 2: {
            message.defaultPattern = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a PatternRef message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.PatternRef
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.PatternRef} PatternRef
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PatternRef.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a PatternRef message.
     * @function verify
     * @memberof douyin.PatternRef
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    PatternRef.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.key != null && message.hasOwnProperty("key"))
        if (!$util.isString(message.key)) return "key: string expected";
      if (message.defaultPattern != null && message.hasOwnProperty("defaultPattern"))
        if (!$util.isString(message.defaultPattern)) return "defaultPattern: string expected";
      return null;
    };

    /**
     * Creates a PatternRef message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.PatternRef
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.PatternRef} PatternRef
     */
    PatternRef.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.PatternRef) return object;
      let message = new $root.douyin.PatternRef();
      if (object.key != null) message.key = String(object.key);
      if (object.defaultPattern != null) message.defaultPattern = String(object.defaultPattern);
      return message;
    };

    /**
     * Creates a plain object from a PatternRef message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.PatternRef
     * @static
     * @param {douyin.PatternRef} message PatternRef
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    PatternRef.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.key = "";
        object.defaultPattern = "";
      }
      if (message.key != null && message.hasOwnProperty("key")) object.key = message.key;
      if (message.defaultPattern != null && message.hasOwnProperty("defaultPattern"))
        object.defaultPattern = message.defaultPattern;
      return object;
    };

    /**
     * Converts this PatternRef to JSON.
     * @function toJSON
     * @memberof douyin.PatternRef
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    PatternRef.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for PatternRef
     * @function getTypeUrl
     * @memberof douyin.PatternRef
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    PatternRef.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.PatternRef";
    };

    return PatternRef;
  })();

  douyin.TextPieceUser = (function () {
    /**
     * Properties of a TextPieceUser.
     * @memberof douyin
     * @interface ITextPieceUser
     * @property {douyin.IUser|null} [user] TextPieceUser user
     * @property {boolean|null} [withColon] TextPieceUser withColon
     */

    /**
     * Constructs a new TextPieceUser.
     * @memberof douyin
     * @classdesc Represents a TextPieceUser.
     * @implements ITextPieceUser
     * @constructor
     * @param {douyin.ITextPieceUser=} [properties] Properties to set
     */
    function TextPieceUser(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * TextPieceUser user.
     * @member {douyin.IUser|null|undefined} user
     * @memberof douyin.TextPieceUser
     * @instance
     */
    TextPieceUser.prototype.user = null;

    /**
     * TextPieceUser withColon.
     * @member {boolean} withColon
     * @memberof douyin.TextPieceUser
     * @instance
     */
    TextPieceUser.prototype.withColon = false;

    /**
     * Creates a new TextPieceUser instance using the specified properties.
     * @function create
     * @memberof douyin.TextPieceUser
     * @static
     * @param {douyin.ITextPieceUser=} [properties] Properties to set
     * @returns {douyin.TextPieceUser} TextPieceUser instance
     */
    TextPieceUser.create = function create(properties) {
      return new TextPieceUser(properties);
    };

    /**
     * Encodes the specified TextPieceUser message. Does not implicitly {@link douyin.TextPieceUser.verify|verify} messages.
     * @function encode
     * @memberof douyin.TextPieceUser
     * @static
     * @param {douyin.ITextPieceUser} message TextPieceUser message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TextPieceUser.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.user != null && Object.hasOwnProperty.call(message, "user"))
        $root.douyin.User.encode(
          message.user,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (message.withColon != null && Object.hasOwnProperty.call(message, "withColon"))
        writer.uint32(/* id 2, wireType 0 =*/ 16).bool(message.withColon);
      return writer;
    };

    /**
     * Encodes the specified TextPieceUser message, length delimited. Does not implicitly {@link douyin.TextPieceUser.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.TextPieceUser
     * @static
     * @param {douyin.ITextPieceUser} message TextPieceUser message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TextPieceUser.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a TextPieceUser message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.TextPieceUser
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.TextPieceUser} TextPieceUser
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TextPieceUser.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.TextPieceUser();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.user = $root.douyin.User.decode(reader, reader.uint32());
            break;
          }
          case 2: {
            message.withColon = reader.bool();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a TextPieceUser message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.TextPieceUser
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.TextPieceUser} TextPieceUser
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TextPieceUser.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a TextPieceUser message.
     * @function verify
     * @memberof douyin.TextPieceUser
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    TextPieceUser.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.user != null && message.hasOwnProperty("user")) {
        let error = $root.douyin.User.verify(message.user);
        if (error) return "user." + error;
      }
      if (message.withColon != null && message.hasOwnProperty("withColon"))
        if (typeof message.withColon !== "boolean") return "withColon: boolean expected";
      return null;
    };

    /**
     * Creates a TextPieceUser message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.TextPieceUser
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.TextPieceUser} TextPieceUser
     */
    TextPieceUser.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.TextPieceUser) return object;
      let message = new $root.douyin.TextPieceUser();
      if (object.user != null) {
        if (typeof object.user !== "object")
          throw TypeError(".douyin.TextPieceUser.user: object expected");
        message.user = $root.douyin.User.fromObject(object.user);
      }
      if (object.withColon != null) message.withColon = Boolean(object.withColon);
      return message;
    };

    /**
     * Creates a plain object from a TextPieceUser message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.TextPieceUser
     * @static
     * @param {douyin.TextPieceUser} message TextPieceUser
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    TextPieceUser.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.user = null;
        object.withColon = false;
      }
      if (message.user != null && message.hasOwnProperty("user"))
        object.user = $root.douyin.User.toObject(message.user, options);
      if (message.withColon != null && message.hasOwnProperty("withColon"))
        object.withColon = message.withColon;
      return object;
    };

    /**
     * Converts this TextPieceUser to JSON.
     * @function toJSON
     * @memberof douyin.TextPieceUser
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    TextPieceUser.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for TextPieceUser
     * @function getTypeUrl
     * @memberof douyin.TextPieceUser
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    TextPieceUser.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.TextPieceUser";
    };

    return TextPieceUser;
  })();

  douyin.TextFormat = (function () {
    /**
     * Properties of a TextFormat.
     * @memberof douyin
     * @interface ITextFormat
     * @property {string|null} [color] TextFormat color
     * @property {boolean|null} [bold] TextFormat bold
     * @property {boolean|null} [italic] TextFormat italic
     * @property {number|null} [weight] TextFormat weight
     * @property {number|null} [italicAngle] TextFormat italicAngle
     * @property {number|null} [fontSize] TextFormat fontSize
     * @property {boolean|null} [useHeighLightColor] TextFormat useHeighLightColor
     * @property {boolean|null} [useRemoteClor] TextFormat useRemoteClor
     */

    /**
     * Constructs a new TextFormat.
     * @memberof douyin
     * @classdesc Represents a TextFormat.
     * @implements ITextFormat
     * @constructor
     * @param {douyin.ITextFormat=} [properties] Properties to set
     */
    function TextFormat(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * TextFormat color.
     * @member {string} color
     * @memberof douyin.TextFormat
     * @instance
     */
    TextFormat.prototype.color = "";

    /**
     * TextFormat bold.
     * @member {boolean} bold
     * @memberof douyin.TextFormat
     * @instance
     */
    TextFormat.prototype.bold = false;

    /**
     * TextFormat italic.
     * @member {boolean} italic
     * @memberof douyin.TextFormat
     * @instance
     */
    TextFormat.prototype.italic = false;

    /**
     * TextFormat weight.
     * @member {number} weight
     * @memberof douyin.TextFormat
     * @instance
     */
    TextFormat.prototype.weight = 0;

    /**
     * TextFormat italicAngle.
     * @member {number} italicAngle
     * @memberof douyin.TextFormat
     * @instance
     */
    TextFormat.prototype.italicAngle = 0;

    /**
     * TextFormat fontSize.
     * @member {number} fontSize
     * @memberof douyin.TextFormat
     * @instance
     */
    TextFormat.prototype.fontSize = 0;

    /**
     * TextFormat useHeighLightColor.
     * @member {boolean} useHeighLightColor
     * @memberof douyin.TextFormat
     * @instance
     */
    TextFormat.prototype.useHeighLightColor = false;

    /**
     * TextFormat useRemoteClor.
     * @member {boolean} useRemoteClor
     * @memberof douyin.TextFormat
     * @instance
     */
    TextFormat.prototype.useRemoteClor = false;

    /**
     * Creates a new TextFormat instance using the specified properties.
     * @function create
     * @memberof douyin.TextFormat
     * @static
     * @param {douyin.ITextFormat=} [properties] Properties to set
     * @returns {douyin.TextFormat} TextFormat instance
     */
    TextFormat.create = function create(properties) {
      return new TextFormat(properties);
    };

    /**
     * Encodes the specified TextFormat message. Does not implicitly {@link douyin.TextFormat.verify|verify} messages.
     * @function encode
     * @memberof douyin.TextFormat
     * @static
     * @param {douyin.ITextFormat} message TextFormat message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TextFormat.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.color != null && Object.hasOwnProperty.call(message, "color"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.color);
      if (message.bold != null && Object.hasOwnProperty.call(message, "bold"))
        writer.uint32(/* id 2, wireType 0 =*/ 16).bool(message.bold);
      if (message.italic != null && Object.hasOwnProperty.call(message, "italic"))
        writer.uint32(/* id 3, wireType 0 =*/ 24).bool(message.italic);
      if (message.weight != null && Object.hasOwnProperty.call(message, "weight"))
        writer.uint32(/* id 4, wireType 0 =*/ 32).uint32(message.weight);
      if (message.italicAngle != null && Object.hasOwnProperty.call(message, "italicAngle"))
        writer.uint32(/* id 5, wireType 0 =*/ 40).uint32(message.italicAngle);
      if (message.fontSize != null && Object.hasOwnProperty.call(message, "fontSize"))
        writer.uint32(/* id 6, wireType 0 =*/ 48).uint32(message.fontSize);
      if (
        message.useHeighLightColor != null &&
        Object.hasOwnProperty.call(message, "useHeighLightColor")
      )
        writer.uint32(/* id 7, wireType 0 =*/ 56).bool(message.useHeighLightColor);
      if (message.useRemoteClor != null && Object.hasOwnProperty.call(message, "useRemoteClor"))
        writer.uint32(/* id 8, wireType 0 =*/ 64).bool(message.useRemoteClor);
      return writer;
    };

    /**
     * Encodes the specified TextFormat message, length delimited. Does not implicitly {@link douyin.TextFormat.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.TextFormat
     * @static
     * @param {douyin.ITextFormat} message TextFormat message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TextFormat.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a TextFormat message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.TextFormat
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.TextFormat} TextFormat
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TextFormat.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.TextFormat();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.color = reader.string();
            break;
          }
          case 2: {
            message.bold = reader.bool();
            break;
          }
          case 3: {
            message.italic = reader.bool();
            break;
          }
          case 4: {
            message.weight = reader.uint32();
            break;
          }
          case 5: {
            message.italicAngle = reader.uint32();
            break;
          }
          case 6: {
            message.fontSize = reader.uint32();
            break;
          }
          case 7: {
            message.useHeighLightColor = reader.bool();
            break;
          }
          case 8: {
            message.useRemoteClor = reader.bool();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a TextFormat message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.TextFormat
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.TextFormat} TextFormat
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TextFormat.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a TextFormat message.
     * @function verify
     * @memberof douyin.TextFormat
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    TextFormat.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.color != null && message.hasOwnProperty("color"))
        if (!$util.isString(message.color)) return "color: string expected";
      if (message.bold != null && message.hasOwnProperty("bold"))
        if (typeof message.bold !== "boolean") return "bold: boolean expected";
      if (message.italic != null && message.hasOwnProperty("italic"))
        if (typeof message.italic !== "boolean") return "italic: boolean expected";
      if (message.weight != null && message.hasOwnProperty("weight"))
        if (!$util.isInteger(message.weight)) return "weight: integer expected";
      if (message.italicAngle != null && message.hasOwnProperty("italicAngle"))
        if (!$util.isInteger(message.italicAngle)) return "italicAngle: integer expected";
      if (message.fontSize != null && message.hasOwnProperty("fontSize"))
        if (!$util.isInteger(message.fontSize)) return "fontSize: integer expected";
      if (message.useHeighLightColor != null && message.hasOwnProperty("useHeighLightColor"))
        if (typeof message.useHeighLightColor !== "boolean")
          return "useHeighLightColor: boolean expected";
      if (message.useRemoteClor != null && message.hasOwnProperty("useRemoteClor"))
        if (typeof message.useRemoteClor !== "boolean") return "useRemoteClor: boolean expected";
      return null;
    };

    /**
     * Creates a TextFormat message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.TextFormat
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.TextFormat} TextFormat
     */
    TextFormat.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.TextFormat) return object;
      let message = new $root.douyin.TextFormat();
      if (object.color != null) message.color = String(object.color);
      if (object.bold != null) message.bold = Boolean(object.bold);
      if (object.italic != null) message.italic = Boolean(object.italic);
      if (object.weight != null) message.weight = object.weight >>> 0;
      if (object.italicAngle != null) message.italicAngle = object.italicAngle >>> 0;
      if (object.fontSize != null) message.fontSize = object.fontSize >>> 0;
      if (object.useHeighLightColor != null)
        message.useHeighLightColor = Boolean(object.useHeighLightColor);
      if (object.useRemoteClor != null) message.useRemoteClor = Boolean(object.useRemoteClor);
      return message;
    };

    /**
     * Creates a plain object from a TextFormat message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.TextFormat
     * @static
     * @param {douyin.TextFormat} message TextFormat
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    TextFormat.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.color = "";
        object.bold = false;
        object.italic = false;
        object.weight = 0;
        object.italicAngle = 0;
        object.fontSize = 0;
        object.useHeighLightColor = false;
        object.useRemoteClor = false;
      }
      if (message.color != null && message.hasOwnProperty("color")) object.color = message.color;
      if (message.bold != null && message.hasOwnProperty("bold")) object.bold = message.bold;
      if (message.italic != null && message.hasOwnProperty("italic"))
        object.italic = message.italic;
      if (message.weight != null && message.hasOwnProperty("weight"))
        object.weight = message.weight;
      if (message.italicAngle != null && message.hasOwnProperty("italicAngle"))
        object.italicAngle = message.italicAngle;
      if (message.fontSize != null && message.hasOwnProperty("fontSize"))
        object.fontSize = message.fontSize;
      if (message.useHeighLightColor != null && message.hasOwnProperty("useHeighLightColor"))
        object.useHeighLightColor = message.useHeighLightColor;
      if (message.useRemoteClor != null && message.hasOwnProperty("useRemoteClor"))
        object.useRemoteClor = message.useRemoteClor;
      return object;
    };

    /**
     * Converts this TextFormat to JSON.
     * @function toJSON
     * @memberof douyin.TextFormat
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    TextFormat.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for TextFormat
     * @function getTypeUrl
     * @memberof douyin.TextFormat
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    TextFormat.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.TextFormat";
    };

    return TextFormat;
  })();

  douyin.LikeMessage = (function () {
    /**
     * Properties of a LikeMessage.
     * @memberof douyin
     * @interface ILikeMessage
     * @property {douyin.ICommon|null} [common] LikeMessage common
     * @property {number|Long|null} [count] LikeMessage count
     * @property {number|Long|null} [total] LikeMessage total
     * @property {number|Long|null} [color] LikeMessage color
     * @property {douyin.IUser|null} [user] LikeMessage user
     * @property {string|null} [icon] LikeMessage icon
     * @property {douyin.IDoubleLikeDetail|null} [doubleLikeDetail] LikeMessage doubleLikeDetail
     * @property {douyin.IDisplayControlInfo|null} [displayControlInfo] LikeMessage displayControlInfo
     * @property {number|Long|null} [linkmicGuestUid] LikeMessage linkmicGuestUid
     * @property {string|null} [scene] LikeMessage scene
     * @property {douyin.IPicoDisplayInfo|null} [picoDisplayInfo] LikeMessage picoDisplayInfo
     */

    /**
     * Constructs a new LikeMessage.
     * @memberof douyin
     * @classdesc Represents a LikeMessage.
     * @implements ILikeMessage
     * @constructor
     * @param {douyin.ILikeMessage=} [properties] Properties to set
     */
    function LikeMessage(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * LikeMessage common.
     * @member {douyin.ICommon|null|undefined} common
     * @memberof douyin.LikeMessage
     * @instance
     */
    LikeMessage.prototype.common = null;

    /**
     * LikeMessage count.
     * @member {number|Long} count
     * @memberof douyin.LikeMessage
     * @instance
     */
    LikeMessage.prototype.count = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * LikeMessage total.
     * @member {number|Long} total
     * @memberof douyin.LikeMessage
     * @instance
     */
    LikeMessage.prototype.total = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * LikeMessage color.
     * @member {number|Long} color
     * @memberof douyin.LikeMessage
     * @instance
     */
    LikeMessage.prototype.color = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * LikeMessage user.
     * @member {douyin.IUser|null|undefined} user
     * @memberof douyin.LikeMessage
     * @instance
     */
    LikeMessage.prototype.user = null;

    /**
     * LikeMessage icon.
     * @member {string} icon
     * @memberof douyin.LikeMessage
     * @instance
     */
    LikeMessage.prototype.icon = "";

    /**
     * LikeMessage doubleLikeDetail.
     * @member {douyin.IDoubleLikeDetail|null|undefined} doubleLikeDetail
     * @memberof douyin.LikeMessage
     * @instance
     */
    LikeMessage.prototype.doubleLikeDetail = null;

    /**
     * LikeMessage displayControlInfo.
     * @member {douyin.IDisplayControlInfo|null|undefined} displayControlInfo
     * @memberof douyin.LikeMessage
     * @instance
     */
    LikeMessage.prototype.displayControlInfo = null;

    /**
     * LikeMessage linkmicGuestUid.
     * @member {number|Long} linkmicGuestUid
     * @memberof douyin.LikeMessage
     * @instance
     */
    LikeMessage.prototype.linkmicGuestUid = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * LikeMessage scene.
     * @member {string} scene
     * @memberof douyin.LikeMessage
     * @instance
     */
    LikeMessage.prototype.scene = "";

    /**
     * LikeMessage picoDisplayInfo.
     * @member {douyin.IPicoDisplayInfo|null|undefined} picoDisplayInfo
     * @memberof douyin.LikeMessage
     * @instance
     */
    LikeMessage.prototype.picoDisplayInfo = null;

    /**
     * Creates a new LikeMessage instance using the specified properties.
     * @function create
     * @memberof douyin.LikeMessage
     * @static
     * @param {douyin.ILikeMessage=} [properties] Properties to set
     * @returns {douyin.LikeMessage} LikeMessage instance
     */
    LikeMessage.create = function create(properties) {
      return new LikeMessage(properties);
    };

    /**
     * Encodes the specified LikeMessage message. Does not implicitly {@link douyin.LikeMessage.verify|verify} messages.
     * @function encode
     * @memberof douyin.LikeMessage
     * @static
     * @param {douyin.ILikeMessage} message LikeMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    LikeMessage.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.common != null && Object.hasOwnProperty.call(message, "common"))
        $root.douyin.Common.encode(
          message.common,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (message.count != null && Object.hasOwnProperty.call(message, "count"))
        writer.uint32(/* id 2, wireType 0 =*/ 16).uint64(message.count);
      if (message.total != null && Object.hasOwnProperty.call(message, "total"))
        writer.uint32(/* id 3, wireType 0 =*/ 24).uint64(message.total);
      if (message.color != null && Object.hasOwnProperty.call(message, "color"))
        writer.uint32(/* id 4, wireType 0 =*/ 32).uint64(message.color);
      if (message.user != null && Object.hasOwnProperty.call(message, "user"))
        $root.douyin.User.encode(
          message.user,
          writer.uint32(/* id 5, wireType 2 =*/ 42).fork(),
        ).ldelim();
      if (message.icon != null && Object.hasOwnProperty.call(message, "icon"))
        writer.uint32(/* id 6, wireType 2 =*/ 50).string(message.icon);
      if (
        message.doubleLikeDetail != null &&
        Object.hasOwnProperty.call(message, "doubleLikeDetail")
      )
        $root.douyin.DoubleLikeDetail.encode(
          message.doubleLikeDetail,
          writer.uint32(/* id 7, wireType 2 =*/ 58).fork(),
        ).ldelim();
      if (
        message.displayControlInfo != null &&
        Object.hasOwnProperty.call(message, "displayControlInfo")
      )
        $root.douyin.DisplayControlInfo.encode(
          message.displayControlInfo,
          writer.uint32(/* id 8, wireType 2 =*/ 66).fork(),
        ).ldelim();
      if (message.linkmicGuestUid != null && Object.hasOwnProperty.call(message, "linkmicGuestUid"))
        writer.uint32(/* id 9, wireType 0 =*/ 72).uint64(message.linkmicGuestUid);
      if (message.scene != null && Object.hasOwnProperty.call(message, "scene"))
        writer.uint32(/* id 10, wireType 2 =*/ 82).string(message.scene);
      if (message.picoDisplayInfo != null && Object.hasOwnProperty.call(message, "picoDisplayInfo"))
        $root.douyin.PicoDisplayInfo.encode(
          message.picoDisplayInfo,
          writer.uint32(/* id 11, wireType 2 =*/ 90).fork(),
        ).ldelim();
      return writer;
    };

    /**
     * Encodes the specified LikeMessage message, length delimited. Does not implicitly {@link douyin.LikeMessage.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.LikeMessage
     * @static
     * @param {douyin.ILikeMessage} message LikeMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    LikeMessage.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a LikeMessage message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.LikeMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.LikeMessage} LikeMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    LikeMessage.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.LikeMessage();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.common = $root.douyin.Common.decode(reader, reader.uint32());
            break;
          }
          case 2: {
            message.count = reader.uint64();
            break;
          }
          case 3: {
            message.total = reader.uint64();
            break;
          }
          case 4: {
            message.color = reader.uint64();
            break;
          }
          case 5: {
            message.user = $root.douyin.User.decode(reader, reader.uint32());
            break;
          }
          case 6: {
            message.icon = reader.string();
            break;
          }
          case 7: {
            message.doubleLikeDetail = $root.douyin.DoubleLikeDetail.decode(
              reader,
              reader.uint32(),
            );
            break;
          }
          case 8: {
            message.displayControlInfo = $root.douyin.DisplayControlInfo.decode(
              reader,
              reader.uint32(),
            );
            break;
          }
          case 9: {
            message.linkmicGuestUid = reader.uint64();
            break;
          }
          case 10: {
            message.scene = reader.string();
            break;
          }
          case 11: {
            message.picoDisplayInfo = $root.douyin.PicoDisplayInfo.decode(reader, reader.uint32());
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a LikeMessage message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.LikeMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.LikeMessage} LikeMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    LikeMessage.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a LikeMessage message.
     * @function verify
     * @memberof douyin.LikeMessage
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    LikeMessage.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.common != null && message.hasOwnProperty("common")) {
        let error = $root.douyin.Common.verify(message.common);
        if (error) return "common." + error;
      }
      if (message.count != null && message.hasOwnProperty("count"))
        if (
          !$util.isInteger(message.count) &&
          !(
            message.count &&
            $util.isInteger(message.count.low) &&
            $util.isInteger(message.count.high)
          )
        )
          return "count: integer|Long expected";
      if (message.total != null && message.hasOwnProperty("total"))
        if (
          !$util.isInteger(message.total) &&
          !(
            message.total &&
            $util.isInteger(message.total.low) &&
            $util.isInteger(message.total.high)
          )
        )
          return "total: integer|Long expected";
      if (message.color != null && message.hasOwnProperty("color"))
        if (
          !$util.isInteger(message.color) &&
          !(
            message.color &&
            $util.isInteger(message.color.low) &&
            $util.isInteger(message.color.high)
          )
        )
          return "color: integer|Long expected";
      if (message.user != null && message.hasOwnProperty("user")) {
        let error = $root.douyin.User.verify(message.user);
        if (error) return "user." + error;
      }
      if (message.icon != null && message.hasOwnProperty("icon"))
        if (!$util.isString(message.icon)) return "icon: string expected";
      if (message.doubleLikeDetail != null && message.hasOwnProperty("doubleLikeDetail")) {
        let error = $root.douyin.DoubleLikeDetail.verify(message.doubleLikeDetail);
        if (error) return "doubleLikeDetail." + error;
      }
      if (message.displayControlInfo != null && message.hasOwnProperty("displayControlInfo")) {
        let error = $root.douyin.DisplayControlInfo.verify(message.displayControlInfo);
        if (error) return "displayControlInfo." + error;
      }
      if (message.linkmicGuestUid != null && message.hasOwnProperty("linkmicGuestUid"))
        if (
          !$util.isInteger(message.linkmicGuestUid) &&
          !(
            message.linkmicGuestUid &&
            $util.isInteger(message.linkmicGuestUid.low) &&
            $util.isInteger(message.linkmicGuestUid.high)
          )
        )
          return "linkmicGuestUid: integer|Long expected";
      if (message.scene != null && message.hasOwnProperty("scene"))
        if (!$util.isString(message.scene)) return "scene: string expected";
      if (message.picoDisplayInfo != null && message.hasOwnProperty("picoDisplayInfo")) {
        let error = $root.douyin.PicoDisplayInfo.verify(message.picoDisplayInfo);
        if (error) return "picoDisplayInfo." + error;
      }
      return null;
    };

    /**
     * Creates a LikeMessage message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.LikeMessage
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.LikeMessage} LikeMessage
     */
    LikeMessage.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.LikeMessage) return object;
      let message = new $root.douyin.LikeMessage();
      if (object.common != null) {
        if (typeof object.common !== "object")
          throw TypeError(".douyin.LikeMessage.common: object expected");
        message.common = $root.douyin.Common.fromObject(object.common);
      }
      if (object.count != null)
        if ($util.Long) (message.count = $util.Long.fromValue(object.count)).unsigned = true;
        else if (typeof object.count === "string") message.count = parseInt(object.count, 10);
        else if (typeof object.count === "number") message.count = object.count;
        else if (typeof object.count === "object")
          message.count = new $util.LongBits(
            object.count.low >>> 0,
            object.count.high >>> 0,
          ).toNumber(true);
      if (object.total != null)
        if ($util.Long) (message.total = $util.Long.fromValue(object.total)).unsigned = true;
        else if (typeof object.total === "string") message.total = parseInt(object.total, 10);
        else if (typeof object.total === "number") message.total = object.total;
        else if (typeof object.total === "object")
          message.total = new $util.LongBits(
            object.total.low >>> 0,
            object.total.high >>> 0,
          ).toNumber(true);
      if (object.color != null)
        if ($util.Long) (message.color = $util.Long.fromValue(object.color)).unsigned = true;
        else if (typeof object.color === "string") message.color = parseInt(object.color, 10);
        else if (typeof object.color === "number") message.color = object.color;
        else if (typeof object.color === "object")
          message.color = new $util.LongBits(
            object.color.low >>> 0,
            object.color.high >>> 0,
          ).toNumber(true);
      if (object.user != null) {
        if (typeof object.user !== "object")
          throw TypeError(".douyin.LikeMessage.user: object expected");
        message.user = $root.douyin.User.fromObject(object.user);
      }
      if (object.icon != null) message.icon = String(object.icon);
      if (object.doubleLikeDetail != null) {
        if (typeof object.doubleLikeDetail !== "object")
          throw TypeError(".douyin.LikeMessage.doubleLikeDetail: object expected");
        message.doubleLikeDetail = $root.douyin.DoubleLikeDetail.fromObject(
          object.doubleLikeDetail,
        );
      }
      if (object.displayControlInfo != null) {
        if (typeof object.displayControlInfo !== "object")
          throw TypeError(".douyin.LikeMessage.displayControlInfo: object expected");
        message.displayControlInfo = $root.douyin.DisplayControlInfo.fromObject(
          object.displayControlInfo,
        );
      }
      if (object.linkmicGuestUid != null)
        if ($util.Long)
          (message.linkmicGuestUid = $util.Long.fromValue(object.linkmicGuestUid)).unsigned = true;
        else if (typeof object.linkmicGuestUid === "string")
          message.linkmicGuestUid = parseInt(object.linkmicGuestUid, 10);
        else if (typeof object.linkmicGuestUid === "number")
          message.linkmicGuestUid = object.linkmicGuestUid;
        else if (typeof object.linkmicGuestUid === "object")
          message.linkmicGuestUid = new $util.LongBits(
            object.linkmicGuestUid.low >>> 0,
            object.linkmicGuestUid.high >>> 0,
          ).toNumber(true);
      if (object.scene != null) message.scene = String(object.scene);
      if (object.picoDisplayInfo != null) {
        if (typeof object.picoDisplayInfo !== "object")
          throw TypeError(".douyin.LikeMessage.picoDisplayInfo: object expected");
        message.picoDisplayInfo = $root.douyin.PicoDisplayInfo.fromObject(object.picoDisplayInfo);
      }
      return message;
    };

    /**
     * Creates a plain object from a LikeMessage message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.LikeMessage
     * @static
     * @param {douyin.LikeMessage} message LikeMessage
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    LikeMessage.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.common = null;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.count =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.count = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.total =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.total = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.color =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.color = options.longs === String ? "0" : 0;
        object.user = null;
        object.icon = "";
        object.doubleLikeDetail = null;
        object.displayControlInfo = null;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.linkmicGuestUid =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.linkmicGuestUid = options.longs === String ? "0" : 0;
        object.scene = "";
        object.picoDisplayInfo = null;
      }
      if (message.common != null && message.hasOwnProperty("common"))
        object.common = $root.douyin.Common.toObject(message.common, options);
      if (message.count != null && message.hasOwnProperty("count"))
        if (typeof message.count === "number")
          object.count = options.longs === String ? String(message.count) : message.count;
        else
          object.count =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.count)
              : options.longs === Number
                ? new $util.LongBits(message.count.low >>> 0, message.count.high >>> 0).toNumber(
                    true,
                  )
                : message.count;
      if (message.total != null && message.hasOwnProperty("total"))
        if (typeof message.total === "number")
          object.total = options.longs === String ? String(message.total) : message.total;
        else
          object.total =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.total)
              : options.longs === Number
                ? new $util.LongBits(message.total.low >>> 0, message.total.high >>> 0).toNumber(
                    true,
                  )
                : message.total;
      if (message.color != null && message.hasOwnProperty("color"))
        if (typeof message.color === "number")
          object.color = options.longs === String ? String(message.color) : message.color;
        else
          object.color =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.color)
              : options.longs === Number
                ? new $util.LongBits(message.color.low >>> 0, message.color.high >>> 0).toNumber(
                    true,
                  )
                : message.color;
      if (message.user != null && message.hasOwnProperty("user"))
        object.user = $root.douyin.User.toObject(message.user, options);
      if (message.icon != null && message.hasOwnProperty("icon")) object.icon = message.icon;
      if (message.doubleLikeDetail != null && message.hasOwnProperty("doubleLikeDetail"))
        object.doubleLikeDetail = $root.douyin.DoubleLikeDetail.toObject(
          message.doubleLikeDetail,
          options,
        );
      if (message.displayControlInfo != null && message.hasOwnProperty("displayControlInfo"))
        object.displayControlInfo = $root.douyin.DisplayControlInfo.toObject(
          message.displayControlInfo,
          options,
        );
      if (message.linkmicGuestUid != null && message.hasOwnProperty("linkmicGuestUid"))
        if (typeof message.linkmicGuestUid === "number")
          object.linkmicGuestUid =
            options.longs === String ? String(message.linkmicGuestUid) : message.linkmicGuestUid;
        else
          object.linkmicGuestUid =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.linkmicGuestUid)
              : options.longs === Number
                ? new $util.LongBits(
                    message.linkmicGuestUid.low >>> 0,
                    message.linkmicGuestUid.high >>> 0,
                  ).toNumber(true)
                : message.linkmicGuestUid;
      if (message.scene != null && message.hasOwnProperty("scene")) object.scene = message.scene;
      if (message.picoDisplayInfo != null && message.hasOwnProperty("picoDisplayInfo"))
        object.picoDisplayInfo = $root.douyin.PicoDisplayInfo.toObject(
          message.picoDisplayInfo,
          options,
        );
      return object;
    };

    /**
     * Converts this LikeMessage to JSON.
     * @function toJSON
     * @memberof douyin.LikeMessage
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    LikeMessage.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for LikeMessage
     * @function getTypeUrl
     * @memberof douyin.LikeMessage
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    LikeMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.LikeMessage";
    };

    return LikeMessage;
  })();

  douyin.SocialMessage = (function () {
    /**
     * Properties of a SocialMessage.
     * @memberof douyin
     * @interface ISocialMessage
     * @property {douyin.ICommon|null} [common] SocialMessage common
     * @property {douyin.IUser|null} [user] SocialMessage user
     * @property {number|Long|null} [shareType] SocialMessage shareType
     * @property {number|Long|null} [action] SocialMessage action
     * @property {string|null} [shareTarget] SocialMessage shareTarget
     * @property {number|Long|null} [followCount] SocialMessage followCount
     * @property {douyin.IPublicAreaCommon|null} [publicAreaCommon] SocialMessage publicAreaCommon
     */

    /**
     * Constructs a new SocialMessage.
     * @memberof douyin
     * @classdesc Represents a SocialMessage.
     * @implements ISocialMessage
     * @constructor
     * @param {douyin.ISocialMessage=} [properties] Properties to set
     */
    function SocialMessage(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * SocialMessage common.
     * @member {douyin.ICommon|null|undefined} common
     * @memberof douyin.SocialMessage
     * @instance
     */
    SocialMessage.prototype.common = null;

    /**
     * SocialMessage user.
     * @member {douyin.IUser|null|undefined} user
     * @memberof douyin.SocialMessage
     * @instance
     */
    SocialMessage.prototype.user = null;

    /**
     * SocialMessage shareType.
     * @member {number|Long} shareType
     * @memberof douyin.SocialMessage
     * @instance
     */
    SocialMessage.prototype.shareType = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * SocialMessage action.
     * @member {number|Long} action
     * @memberof douyin.SocialMessage
     * @instance
     */
    SocialMessage.prototype.action = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * SocialMessage shareTarget.
     * @member {string} shareTarget
     * @memberof douyin.SocialMessage
     * @instance
     */
    SocialMessage.prototype.shareTarget = "";

    /**
     * SocialMessage followCount.
     * @member {number|Long} followCount
     * @memberof douyin.SocialMessage
     * @instance
     */
    SocialMessage.prototype.followCount = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * SocialMessage publicAreaCommon.
     * @member {douyin.IPublicAreaCommon|null|undefined} publicAreaCommon
     * @memberof douyin.SocialMessage
     * @instance
     */
    SocialMessage.prototype.publicAreaCommon = null;

    /**
     * Creates a new SocialMessage instance using the specified properties.
     * @function create
     * @memberof douyin.SocialMessage
     * @static
     * @param {douyin.ISocialMessage=} [properties] Properties to set
     * @returns {douyin.SocialMessage} SocialMessage instance
     */
    SocialMessage.create = function create(properties) {
      return new SocialMessage(properties);
    };

    /**
     * Encodes the specified SocialMessage message. Does not implicitly {@link douyin.SocialMessage.verify|verify} messages.
     * @function encode
     * @memberof douyin.SocialMessage
     * @static
     * @param {douyin.ISocialMessage} message SocialMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SocialMessage.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.common != null && Object.hasOwnProperty.call(message, "common"))
        $root.douyin.Common.encode(
          message.common,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (message.user != null && Object.hasOwnProperty.call(message, "user"))
        $root.douyin.User.encode(
          message.user,
          writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
        ).ldelim();
      if (message.shareType != null && Object.hasOwnProperty.call(message, "shareType"))
        writer.uint32(/* id 3, wireType 0 =*/ 24).uint64(message.shareType);
      if (message.action != null && Object.hasOwnProperty.call(message, "action"))
        writer.uint32(/* id 4, wireType 0 =*/ 32).uint64(message.action);
      if (message.shareTarget != null && Object.hasOwnProperty.call(message, "shareTarget"))
        writer.uint32(/* id 5, wireType 2 =*/ 42).string(message.shareTarget);
      if (message.followCount != null && Object.hasOwnProperty.call(message, "followCount"))
        writer.uint32(/* id 6, wireType 0 =*/ 48).uint64(message.followCount);
      if (
        message.publicAreaCommon != null &&
        Object.hasOwnProperty.call(message, "publicAreaCommon")
      )
        $root.douyin.PublicAreaCommon.encode(
          message.publicAreaCommon,
          writer.uint32(/* id 7, wireType 2 =*/ 58).fork(),
        ).ldelim();
      return writer;
    };

    /**
     * Encodes the specified SocialMessage message, length delimited. Does not implicitly {@link douyin.SocialMessage.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.SocialMessage
     * @static
     * @param {douyin.ISocialMessage} message SocialMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SocialMessage.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SocialMessage message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.SocialMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.SocialMessage} SocialMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SocialMessage.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.SocialMessage();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.common = $root.douyin.Common.decode(reader, reader.uint32());
            break;
          }
          case 2: {
            message.user = $root.douyin.User.decode(reader, reader.uint32());
            break;
          }
          case 3: {
            message.shareType = reader.uint64();
            break;
          }
          case 4: {
            message.action = reader.uint64();
            break;
          }
          case 5: {
            message.shareTarget = reader.string();
            break;
          }
          case 6: {
            message.followCount = reader.uint64();
            break;
          }
          case 7: {
            message.publicAreaCommon = $root.douyin.PublicAreaCommon.decode(
              reader,
              reader.uint32(),
            );
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a SocialMessage message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.SocialMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.SocialMessage} SocialMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SocialMessage.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SocialMessage message.
     * @function verify
     * @memberof douyin.SocialMessage
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SocialMessage.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.common != null && message.hasOwnProperty("common")) {
        let error = $root.douyin.Common.verify(message.common);
        if (error) return "common." + error;
      }
      if (message.user != null && message.hasOwnProperty("user")) {
        let error = $root.douyin.User.verify(message.user);
        if (error) return "user." + error;
      }
      if (message.shareType != null && message.hasOwnProperty("shareType"))
        if (
          !$util.isInteger(message.shareType) &&
          !(
            message.shareType &&
            $util.isInteger(message.shareType.low) &&
            $util.isInteger(message.shareType.high)
          )
        )
          return "shareType: integer|Long expected";
      if (message.action != null && message.hasOwnProperty("action"))
        if (
          !$util.isInteger(message.action) &&
          !(
            message.action &&
            $util.isInteger(message.action.low) &&
            $util.isInteger(message.action.high)
          )
        )
          return "action: integer|Long expected";
      if (message.shareTarget != null && message.hasOwnProperty("shareTarget"))
        if (!$util.isString(message.shareTarget)) return "shareTarget: string expected";
      if (message.followCount != null && message.hasOwnProperty("followCount"))
        if (
          !$util.isInteger(message.followCount) &&
          !(
            message.followCount &&
            $util.isInteger(message.followCount.low) &&
            $util.isInteger(message.followCount.high)
          )
        )
          return "followCount: integer|Long expected";
      if (message.publicAreaCommon != null && message.hasOwnProperty("publicAreaCommon")) {
        let error = $root.douyin.PublicAreaCommon.verify(message.publicAreaCommon);
        if (error) return "publicAreaCommon." + error;
      }
      return null;
    };

    /**
     * Creates a SocialMessage message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.SocialMessage
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.SocialMessage} SocialMessage
     */
    SocialMessage.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.SocialMessage) return object;
      let message = new $root.douyin.SocialMessage();
      if (object.common != null) {
        if (typeof object.common !== "object")
          throw TypeError(".douyin.SocialMessage.common: object expected");
        message.common = $root.douyin.Common.fromObject(object.common);
      }
      if (object.user != null) {
        if (typeof object.user !== "object")
          throw TypeError(".douyin.SocialMessage.user: object expected");
        message.user = $root.douyin.User.fromObject(object.user);
      }
      if (object.shareType != null)
        if ($util.Long)
          (message.shareType = $util.Long.fromValue(object.shareType)).unsigned = true;
        else if (typeof object.shareType === "string")
          message.shareType = parseInt(object.shareType, 10);
        else if (typeof object.shareType === "number") message.shareType = object.shareType;
        else if (typeof object.shareType === "object")
          message.shareType = new $util.LongBits(
            object.shareType.low >>> 0,
            object.shareType.high >>> 0,
          ).toNumber(true);
      if (object.action != null)
        if ($util.Long) (message.action = $util.Long.fromValue(object.action)).unsigned = true;
        else if (typeof object.action === "string") message.action = parseInt(object.action, 10);
        else if (typeof object.action === "number") message.action = object.action;
        else if (typeof object.action === "object")
          message.action = new $util.LongBits(
            object.action.low >>> 0,
            object.action.high >>> 0,
          ).toNumber(true);
      if (object.shareTarget != null) message.shareTarget = String(object.shareTarget);
      if (object.followCount != null)
        if ($util.Long)
          (message.followCount = $util.Long.fromValue(object.followCount)).unsigned = true;
        else if (typeof object.followCount === "string")
          message.followCount = parseInt(object.followCount, 10);
        else if (typeof object.followCount === "number") message.followCount = object.followCount;
        else if (typeof object.followCount === "object")
          message.followCount = new $util.LongBits(
            object.followCount.low >>> 0,
            object.followCount.high >>> 0,
          ).toNumber(true);
      if (object.publicAreaCommon != null) {
        if (typeof object.publicAreaCommon !== "object")
          throw TypeError(".douyin.SocialMessage.publicAreaCommon: object expected");
        message.publicAreaCommon = $root.douyin.PublicAreaCommon.fromObject(
          object.publicAreaCommon,
        );
      }
      return message;
    };

    /**
     * Creates a plain object from a SocialMessage message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.SocialMessage
     * @static
     * @param {douyin.SocialMessage} message SocialMessage
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SocialMessage.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.common = null;
        object.user = null;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.shareType =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.shareType = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.action =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.action = options.longs === String ? "0" : 0;
        object.shareTarget = "";
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.followCount =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.followCount = options.longs === String ? "0" : 0;
        object.publicAreaCommon = null;
      }
      if (message.common != null && message.hasOwnProperty("common"))
        object.common = $root.douyin.Common.toObject(message.common, options);
      if (message.user != null && message.hasOwnProperty("user"))
        object.user = $root.douyin.User.toObject(message.user, options);
      if (message.shareType != null && message.hasOwnProperty("shareType"))
        if (typeof message.shareType === "number")
          object.shareType =
            options.longs === String ? String(message.shareType) : message.shareType;
        else
          object.shareType =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.shareType)
              : options.longs === Number
                ? new $util.LongBits(
                    message.shareType.low >>> 0,
                    message.shareType.high >>> 0,
                  ).toNumber(true)
                : message.shareType;
      if (message.action != null && message.hasOwnProperty("action"))
        if (typeof message.action === "number")
          object.action = options.longs === String ? String(message.action) : message.action;
        else
          object.action =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.action)
              : options.longs === Number
                ? new $util.LongBits(message.action.low >>> 0, message.action.high >>> 0).toNumber(
                    true,
                  )
                : message.action;
      if (message.shareTarget != null && message.hasOwnProperty("shareTarget"))
        object.shareTarget = message.shareTarget;
      if (message.followCount != null && message.hasOwnProperty("followCount"))
        if (typeof message.followCount === "number")
          object.followCount =
            options.longs === String ? String(message.followCount) : message.followCount;
        else
          object.followCount =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.followCount)
              : options.longs === Number
                ? new $util.LongBits(
                    message.followCount.low >>> 0,
                    message.followCount.high >>> 0,
                  ).toNumber(true)
                : message.followCount;
      if (message.publicAreaCommon != null && message.hasOwnProperty("publicAreaCommon"))
        object.publicAreaCommon = $root.douyin.PublicAreaCommon.toObject(
          message.publicAreaCommon,
          options,
        );
      return object;
    };

    /**
     * Converts this SocialMessage to JSON.
     * @function toJSON
     * @memberof douyin.SocialMessage
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SocialMessage.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SocialMessage
     * @function getTypeUrl
     * @memberof douyin.SocialMessage
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SocialMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.SocialMessage";
    };

    return SocialMessage;
  })();

  douyin.PicoDisplayInfo = (function () {
    /**
     * Properties of a PicoDisplayInfo.
     * @memberof douyin
     * @interface IPicoDisplayInfo
     * @property {number|Long|null} [comboSumCount] PicoDisplayInfo comboSumCount
     * @property {string|null} [emoji] PicoDisplayInfo emoji
     * @property {douyin.IImage|null} [emojiIcon] PicoDisplayInfo emojiIcon
     * @property {string|null} [emojiText] PicoDisplayInfo emojiText
     */

    /**
     * Constructs a new PicoDisplayInfo.
     * @memberof douyin
     * @classdesc Represents a PicoDisplayInfo.
     * @implements IPicoDisplayInfo
     * @constructor
     * @param {douyin.IPicoDisplayInfo=} [properties] Properties to set
     */
    function PicoDisplayInfo(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * PicoDisplayInfo comboSumCount.
     * @member {number|Long} comboSumCount
     * @memberof douyin.PicoDisplayInfo
     * @instance
     */
    PicoDisplayInfo.prototype.comboSumCount = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * PicoDisplayInfo emoji.
     * @member {string} emoji
     * @memberof douyin.PicoDisplayInfo
     * @instance
     */
    PicoDisplayInfo.prototype.emoji = "";

    /**
     * PicoDisplayInfo emojiIcon.
     * @member {douyin.IImage|null|undefined} emojiIcon
     * @memberof douyin.PicoDisplayInfo
     * @instance
     */
    PicoDisplayInfo.prototype.emojiIcon = null;

    /**
     * PicoDisplayInfo emojiText.
     * @member {string} emojiText
     * @memberof douyin.PicoDisplayInfo
     * @instance
     */
    PicoDisplayInfo.prototype.emojiText = "";

    /**
     * Creates a new PicoDisplayInfo instance using the specified properties.
     * @function create
     * @memberof douyin.PicoDisplayInfo
     * @static
     * @param {douyin.IPicoDisplayInfo=} [properties] Properties to set
     * @returns {douyin.PicoDisplayInfo} PicoDisplayInfo instance
     */
    PicoDisplayInfo.create = function create(properties) {
      return new PicoDisplayInfo(properties);
    };

    /**
     * Encodes the specified PicoDisplayInfo message. Does not implicitly {@link douyin.PicoDisplayInfo.verify|verify} messages.
     * @function encode
     * @memberof douyin.PicoDisplayInfo
     * @static
     * @param {douyin.IPicoDisplayInfo} message PicoDisplayInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PicoDisplayInfo.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.comboSumCount != null && Object.hasOwnProperty.call(message, "comboSumCount"))
        writer.uint32(/* id 1, wireType 0 =*/ 8).uint64(message.comboSumCount);
      if (message.emoji != null && Object.hasOwnProperty.call(message, "emoji"))
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.emoji);
      if (message.emojiIcon != null && Object.hasOwnProperty.call(message, "emojiIcon"))
        $root.douyin.Image.encode(
          message.emojiIcon,
          writer.uint32(/* id 3, wireType 2 =*/ 26).fork(),
        ).ldelim();
      if (message.emojiText != null && Object.hasOwnProperty.call(message, "emojiText"))
        writer.uint32(/* id 4, wireType 2 =*/ 34).string(message.emojiText);
      return writer;
    };

    /**
     * Encodes the specified PicoDisplayInfo message, length delimited. Does not implicitly {@link douyin.PicoDisplayInfo.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.PicoDisplayInfo
     * @static
     * @param {douyin.IPicoDisplayInfo} message PicoDisplayInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PicoDisplayInfo.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a PicoDisplayInfo message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.PicoDisplayInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.PicoDisplayInfo} PicoDisplayInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PicoDisplayInfo.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.PicoDisplayInfo();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.comboSumCount = reader.uint64();
            break;
          }
          case 2: {
            message.emoji = reader.string();
            break;
          }
          case 3: {
            message.emojiIcon = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 4: {
            message.emojiText = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a PicoDisplayInfo message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.PicoDisplayInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.PicoDisplayInfo} PicoDisplayInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PicoDisplayInfo.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a PicoDisplayInfo message.
     * @function verify
     * @memberof douyin.PicoDisplayInfo
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    PicoDisplayInfo.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.comboSumCount != null && message.hasOwnProperty("comboSumCount"))
        if (
          !$util.isInteger(message.comboSumCount) &&
          !(
            message.comboSumCount &&
            $util.isInteger(message.comboSumCount.low) &&
            $util.isInteger(message.comboSumCount.high)
          )
        )
          return "comboSumCount: integer|Long expected";
      if (message.emoji != null && message.hasOwnProperty("emoji"))
        if (!$util.isString(message.emoji)) return "emoji: string expected";
      if (message.emojiIcon != null && message.hasOwnProperty("emojiIcon")) {
        let error = $root.douyin.Image.verify(message.emojiIcon);
        if (error) return "emojiIcon." + error;
      }
      if (message.emojiText != null && message.hasOwnProperty("emojiText"))
        if (!$util.isString(message.emojiText)) return "emojiText: string expected";
      return null;
    };

    /**
     * Creates a PicoDisplayInfo message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.PicoDisplayInfo
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.PicoDisplayInfo} PicoDisplayInfo
     */
    PicoDisplayInfo.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.PicoDisplayInfo) return object;
      let message = new $root.douyin.PicoDisplayInfo();
      if (object.comboSumCount != null)
        if ($util.Long)
          (message.comboSumCount = $util.Long.fromValue(object.comboSumCount)).unsigned = true;
        else if (typeof object.comboSumCount === "string")
          message.comboSumCount = parseInt(object.comboSumCount, 10);
        else if (typeof object.comboSumCount === "number")
          message.comboSumCount = object.comboSumCount;
        else if (typeof object.comboSumCount === "object")
          message.comboSumCount = new $util.LongBits(
            object.comboSumCount.low >>> 0,
            object.comboSumCount.high >>> 0,
          ).toNumber(true);
      if (object.emoji != null) message.emoji = String(object.emoji);
      if (object.emojiIcon != null) {
        if (typeof object.emojiIcon !== "object")
          throw TypeError(".douyin.PicoDisplayInfo.emojiIcon: object expected");
        message.emojiIcon = $root.douyin.Image.fromObject(object.emojiIcon);
      }
      if (object.emojiText != null) message.emojiText = String(object.emojiText);
      return message;
    };

    /**
     * Creates a plain object from a PicoDisplayInfo message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.PicoDisplayInfo
     * @static
     * @param {douyin.PicoDisplayInfo} message PicoDisplayInfo
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    PicoDisplayInfo.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.comboSumCount =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.comboSumCount = options.longs === String ? "0" : 0;
        object.emoji = "";
        object.emojiIcon = null;
        object.emojiText = "";
      }
      if (message.comboSumCount != null && message.hasOwnProperty("comboSumCount"))
        if (typeof message.comboSumCount === "number")
          object.comboSumCount =
            options.longs === String ? String(message.comboSumCount) : message.comboSumCount;
        else
          object.comboSumCount =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.comboSumCount)
              : options.longs === Number
                ? new $util.LongBits(
                    message.comboSumCount.low >>> 0,
                    message.comboSumCount.high >>> 0,
                  ).toNumber(true)
                : message.comboSumCount;
      if (message.emoji != null && message.hasOwnProperty("emoji")) object.emoji = message.emoji;
      if (message.emojiIcon != null && message.hasOwnProperty("emojiIcon"))
        object.emojiIcon = $root.douyin.Image.toObject(message.emojiIcon, options);
      if (message.emojiText != null && message.hasOwnProperty("emojiText"))
        object.emojiText = message.emojiText;
      return object;
    };

    /**
     * Converts this PicoDisplayInfo to JSON.
     * @function toJSON
     * @memberof douyin.PicoDisplayInfo
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    PicoDisplayInfo.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for PicoDisplayInfo
     * @function getTypeUrl
     * @memberof douyin.PicoDisplayInfo
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    PicoDisplayInfo.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.PicoDisplayInfo";
    };

    return PicoDisplayInfo;
  })();

  douyin.DoubleLikeDetail = (function () {
    /**
     * Properties of a DoubleLikeDetail.
     * @memberof douyin
     * @interface IDoubleLikeDetail
     * @property {boolean|null} [doubleFlag] DoubleLikeDetail doubleFlag
     * @property {number|null} [seqId] DoubleLikeDetail seqId
     * @property {number|null} [renewalsNum] DoubleLikeDetail renewalsNum
     * @property {number|null} [triggersNum] DoubleLikeDetail triggersNum
     */

    /**
     * Constructs a new DoubleLikeDetail.
     * @memberof douyin
     * @classdesc Represents a DoubleLikeDetail.
     * @implements IDoubleLikeDetail
     * @constructor
     * @param {douyin.IDoubleLikeDetail=} [properties] Properties to set
     */
    function DoubleLikeDetail(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * DoubleLikeDetail doubleFlag.
     * @member {boolean} doubleFlag
     * @memberof douyin.DoubleLikeDetail
     * @instance
     */
    DoubleLikeDetail.prototype.doubleFlag = false;

    /**
     * DoubleLikeDetail seqId.
     * @member {number} seqId
     * @memberof douyin.DoubleLikeDetail
     * @instance
     */
    DoubleLikeDetail.prototype.seqId = 0;

    /**
     * DoubleLikeDetail renewalsNum.
     * @member {number} renewalsNum
     * @memberof douyin.DoubleLikeDetail
     * @instance
     */
    DoubleLikeDetail.prototype.renewalsNum = 0;

    /**
     * DoubleLikeDetail triggersNum.
     * @member {number} triggersNum
     * @memberof douyin.DoubleLikeDetail
     * @instance
     */
    DoubleLikeDetail.prototype.triggersNum = 0;

    /**
     * Creates a new DoubleLikeDetail instance using the specified properties.
     * @function create
     * @memberof douyin.DoubleLikeDetail
     * @static
     * @param {douyin.IDoubleLikeDetail=} [properties] Properties to set
     * @returns {douyin.DoubleLikeDetail} DoubleLikeDetail instance
     */
    DoubleLikeDetail.create = function create(properties) {
      return new DoubleLikeDetail(properties);
    };

    /**
     * Encodes the specified DoubleLikeDetail message. Does not implicitly {@link douyin.DoubleLikeDetail.verify|verify} messages.
     * @function encode
     * @memberof douyin.DoubleLikeDetail
     * @static
     * @param {douyin.IDoubleLikeDetail} message DoubleLikeDetail message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    DoubleLikeDetail.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.doubleFlag != null && Object.hasOwnProperty.call(message, "doubleFlag"))
        writer.uint32(/* id 1, wireType 0 =*/ 8).bool(message.doubleFlag);
      if (message.seqId != null && Object.hasOwnProperty.call(message, "seqId"))
        writer.uint32(/* id 2, wireType 0 =*/ 16).uint32(message.seqId);
      if (message.renewalsNum != null && Object.hasOwnProperty.call(message, "renewalsNum"))
        writer.uint32(/* id 3, wireType 0 =*/ 24).uint32(message.renewalsNum);
      if (message.triggersNum != null && Object.hasOwnProperty.call(message, "triggersNum"))
        writer.uint32(/* id 4, wireType 0 =*/ 32).uint32(message.triggersNum);
      return writer;
    };

    /**
     * Encodes the specified DoubleLikeDetail message, length delimited. Does not implicitly {@link douyin.DoubleLikeDetail.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.DoubleLikeDetail
     * @static
     * @param {douyin.IDoubleLikeDetail} message DoubleLikeDetail message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    DoubleLikeDetail.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a DoubleLikeDetail message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.DoubleLikeDetail
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.DoubleLikeDetail} DoubleLikeDetail
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    DoubleLikeDetail.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.DoubleLikeDetail();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.doubleFlag = reader.bool();
            break;
          }
          case 2: {
            message.seqId = reader.uint32();
            break;
          }
          case 3: {
            message.renewalsNum = reader.uint32();
            break;
          }
          case 4: {
            message.triggersNum = reader.uint32();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a DoubleLikeDetail message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.DoubleLikeDetail
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.DoubleLikeDetail} DoubleLikeDetail
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    DoubleLikeDetail.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a DoubleLikeDetail message.
     * @function verify
     * @memberof douyin.DoubleLikeDetail
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    DoubleLikeDetail.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.doubleFlag != null && message.hasOwnProperty("doubleFlag"))
        if (typeof message.doubleFlag !== "boolean") return "doubleFlag: boolean expected";
      if (message.seqId != null && message.hasOwnProperty("seqId"))
        if (!$util.isInteger(message.seqId)) return "seqId: integer expected";
      if (message.renewalsNum != null && message.hasOwnProperty("renewalsNum"))
        if (!$util.isInteger(message.renewalsNum)) return "renewalsNum: integer expected";
      if (message.triggersNum != null && message.hasOwnProperty("triggersNum"))
        if (!$util.isInteger(message.triggersNum)) return "triggersNum: integer expected";
      return null;
    };

    /**
     * Creates a DoubleLikeDetail message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.DoubleLikeDetail
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.DoubleLikeDetail} DoubleLikeDetail
     */
    DoubleLikeDetail.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.DoubleLikeDetail) return object;
      let message = new $root.douyin.DoubleLikeDetail();
      if (object.doubleFlag != null) message.doubleFlag = Boolean(object.doubleFlag);
      if (object.seqId != null) message.seqId = object.seqId >>> 0;
      if (object.renewalsNum != null) message.renewalsNum = object.renewalsNum >>> 0;
      if (object.triggersNum != null) message.triggersNum = object.triggersNum >>> 0;
      return message;
    };

    /**
     * Creates a plain object from a DoubleLikeDetail message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.DoubleLikeDetail
     * @static
     * @param {douyin.DoubleLikeDetail} message DoubleLikeDetail
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    DoubleLikeDetail.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.doubleFlag = false;
        object.seqId = 0;
        object.renewalsNum = 0;
        object.triggersNum = 0;
      }
      if (message.doubleFlag != null && message.hasOwnProperty("doubleFlag"))
        object.doubleFlag = message.doubleFlag;
      if (message.seqId != null && message.hasOwnProperty("seqId")) object.seqId = message.seqId;
      if (message.renewalsNum != null && message.hasOwnProperty("renewalsNum"))
        object.renewalsNum = message.renewalsNum;
      if (message.triggersNum != null && message.hasOwnProperty("triggersNum"))
        object.triggersNum = message.triggersNum;
      return object;
    };

    /**
     * Converts this DoubleLikeDetail to JSON.
     * @function toJSON
     * @memberof douyin.DoubleLikeDetail
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    DoubleLikeDetail.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for DoubleLikeDetail
     * @function getTypeUrl
     * @memberof douyin.DoubleLikeDetail
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    DoubleLikeDetail.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.DoubleLikeDetail";
    };

    return DoubleLikeDetail;
  })();

  douyin.DisplayControlInfo = (function () {
    /**
     * Properties of a DisplayControlInfo.
     * @memberof douyin
     * @interface IDisplayControlInfo
     * @property {boolean|null} [showText] DisplayControlInfo showText
     * @property {boolean|null} [showIcons] DisplayControlInfo showIcons
     */

    /**
     * Constructs a new DisplayControlInfo.
     * @memberof douyin
     * @classdesc Represents a DisplayControlInfo.
     * @implements IDisplayControlInfo
     * @constructor
     * @param {douyin.IDisplayControlInfo=} [properties] Properties to set
     */
    function DisplayControlInfo(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * DisplayControlInfo showText.
     * @member {boolean} showText
     * @memberof douyin.DisplayControlInfo
     * @instance
     */
    DisplayControlInfo.prototype.showText = false;

    /**
     * DisplayControlInfo showIcons.
     * @member {boolean} showIcons
     * @memberof douyin.DisplayControlInfo
     * @instance
     */
    DisplayControlInfo.prototype.showIcons = false;

    /**
     * Creates a new DisplayControlInfo instance using the specified properties.
     * @function create
     * @memberof douyin.DisplayControlInfo
     * @static
     * @param {douyin.IDisplayControlInfo=} [properties] Properties to set
     * @returns {douyin.DisplayControlInfo} DisplayControlInfo instance
     */
    DisplayControlInfo.create = function create(properties) {
      return new DisplayControlInfo(properties);
    };

    /**
     * Encodes the specified DisplayControlInfo message. Does not implicitly {@link douyin.DisplayControlInfo.verify|verify} messages.
     * @function encode
     * @memberof douyin.DisplayControlInfo
     * @static
     * @param {douyin.IDisplayControlInfo} message DisplayControlInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    DisplayControlInfo.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.showText != null && Object.hasOwnProperty.call(message, "showText"))
        writer.uint32(/* id 1, wireType 0 =*/ 8).bool(message.showText);
      if (message.showIcons != null && Object.hasOwnProperty.call(message, "showIcons"))
        writer.uint32(/* id 2, wireType 0 =*/ 16).bool(message.showIcons);
      return writer;
    };

    /**
     * Encodes the specified DisplayControlInfo message, length delimited. Does not implicitly {@link douyin.DisplayControlInfo.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.DisplayControlInfo
     * @static
     * @param {douyin.IDisplayControlInfo} message DisplayControlInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    DisplayControlInfo.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a DisplayControlInfo message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.DisplayControlInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.DisplayControlInfo} DisplayControlInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    DisplayControlInfo.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.DisplayControlInfo();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.showText = reader.bool();
            break;
          }
          case 2: {
            message.showIcons = reader.bool();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a DisplayControlInfo message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.DisplayControlInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.DisplayControlInfo} DisplayControlInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    DisplayControlInfo.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a DisplayControlInfo message.
     * @function verify
     * @memberof douyin.DisplayControlInfo
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    DisplayControlInfo.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.showText != null && message.hasOwnProperty("showText"))
        if (typeof message.showText !== "boolean") return "showText: boolean expected";
      if (message.showIcons != null && message.hasOwnProperty("showIcons"))
        if (typeof message.showIcons !== "boolean") return "showIcons: boolean expected";
      return null;
    };

    /**
     * Creates a DisplayControlInfo message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.DisplayControlInfo
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.DisplayControlInfo} DisplayControlInfo
     */
    DisplayControlInfo.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.DisplayControlInfo) return object;
      let message = new $root.douyin.DisplayControlInfo();
      if (object.showText != null) message.showText = Boolean(object.showText);
      if (object.showIcons != null) message.showIcons = Boolean(object.showIcons);
      return message;
    };

    /**
     * Creates a plain object from a DisplayControlInfo message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.DisplayControlInfo
     * @static
     * @param {douyin.DisplayControlInfo} message DisplayControlInfo
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    DisplayControlInfo.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.showText = false;
        object.showIcons = false;
      }
      if (message.showText != null && message.hasOwnProperty("showText"))
        object.showText = message.showText;
      if (message.showIcons != null && message.hasOwnProperty("showIcons"))
        object.showIcons = message.showIcons;
      return object;
    };

    /**
     * Converts this DisplayControlInfo to JSON.
     * @function toJSON
     * @memberof douyin.DisplayControlInfo
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    DisplayControlInfo.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for DisplayControlInfo
     * @function getTypeUrl
     * @memberof douyin.DisplayControlInfo
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    DisplayControlInfo.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.DisplayControlInfo";
    };

    return DisplayControlInfo;
  })();

  douyin.EpisodeChatMessage = (function () {
    /**
     * Properties of an EpisodeChatMessage.
     * @memberof douyin
     * @interface IEpisodeChatMessage
     * @property {douyin.IMessage|null} [common] EpisodeChatMessage common
     * @property {douyin.IUser|null} [user] EpisodeChatMessage user
     * @property {string|null} [content] EpisodeChatMessage content
     * @property {boolean|null} [visibleToSende] EpisodeChatMessage visibleToSende
     * @property {douyin.IImage|null} [giftImage] EpisodeChatMessage giftImage
     * @property {number|Long|null} [agreeMsgId] EpisodeChatMessage agreeMsgId
     * @property {Array.<string>|null} [colorValueList] EpisodeChatMessage colorValueList
     */

    /**
     * Constructs a new EpisodeChatMessage.
     * @memberof douyin
     * @classdesc Represents an EpisodeChatMessage.
     * @implements IEpisodeChatMessage
     * @constructor
     * @param {douyin.IEpisodeChatMessage=} [properties] Properties to set
     */
    function EpisodeChatMessage(properties) {
      this.colorValueList = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * EpisodeChatMessage common.
     * @member {douyin.IMessage|null|undefined} common
     * @memberof douyin.EpisodeChatMessage
     * @instance
     */
    EpisodeChatMessage.prototype.common = null;

    /**
     * EpisodeChatMessage user.
     * @member {douyin.IUser|null|undefined} user
     * @memberof douyin.EpisodeChatMessage
     * @instance
     */
    EpisodeChatMessage.prototype.user = null;

    /**
     * EpisodeChatMessage content.
     * @member {string} content
     * @memberof douyin.EpisodeChatMessage
     * @instance
     */
    EpisodeChatMessage.prototype.content = "";

    /**
     * EpisodeChatMessage visibleToSende.
     * @member {boolean} visibleToSende
     * @memberof douyin.EpisodeChatMessage
     * @instance
     */
    EpisodeChatMessage.prototype.visibleToSende = false;

    /**
     * EpisodeChatMessage giftImage.
     * @member {douyin.IImage|null|undefined} giftImage
     * @memberof douyin.EpisodeChatMessage
     * @instance
     */
    EpisodeChatMessage.prototype.giftImage = null;

    /**
     * EpisodeChatMessage agreeMsgId.
     * @member {number|Long} agreeMsgId
     * @memberof douyin.EpisodeChatMessage
     * @instance
     */
    EpisodeChatMessage.prototype.agreeMsgId = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * EpisodeChatMessage colorValueList.
     * @member {Array.<string>} colorValueList
     * @memberof douyin.EpisodeChatMessage
     * @instance
     */
    EpisodeChatMessage.prototype.colorValueList = $util.emptyArray;

    /**
     * Creates a new EpisodeChatMessage instance using the specified properties.
     * @function create
     * @memberof douyin.EpisodeChatMessage
     * @static
     * @param {douyin.IEpisodeChatMessage=} [properties] Properties to set
     * @returns {douyin.EpisodeChatMessage} EpisodeChatMessage instance
     */
    EpisodeChatMessage.create = function create(properties) {
      return new EpisodeChatMessage(properties);
    };

    /**
     * Encodes the specified EpisodeChatMessage message. Does not implicitly {@link douyin.EpisodeChatMessage.verify|verify} messages.
     * @function encode
     * @memberof douyin.EpisodeChatMessage
     * @static
     * @param {douyin.IEpisodeChatMessage} message EpisodeChatMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    EpisodeChatMessage.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.common != null && Object.hasOwnProperty.call(message, "common"))
        $root.douyin.Message.encode(
          message.common,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (message.user != null && Object.hasOwnProperty.call(message, "user"))
        $root.douyin.User.encode(
          message.user,
          writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
        ).ldelim();
      if (message.content != null && Object.hasOwnProperty.call(message, "content"))
        writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.content);
      if (message.visibleToSende != null && Object.hasOwnProperty.call(message, "visibleToSende"))
        writer.uint32(/* id 4, wireType 0 =*/ 32).bool(message.visibleToSende);
      if (message.giftImage != null && Object.hasOwnProperty.call(message, "giftImage"))
        $root.douyin.Image.encode(
          message.giftImage,
          writer.uint32(/* id 7, wireType 2 =*/ 58).fork(),
        ).ldelim();
      if (message.agreeMsgId != null && Object.hasOwnProperty.call(message, "agreeMsgId"))
        writer.uint32(/* id 8, wireType 0 =*/ 64).uint64(message.agreeMsgId);
      if (message.colorValueList != null && message.colorValueList.length)
        for (let i = 0; i < message.colorValueList.length; ++i)
          writer.uint32(/* id 9, wireType 2 =*/ 74).string(message.colorValueList[i]);
      return writer;
    };

    /**
     * Encodes the specified EpisodeChatMessage message, length delimited. Does not implicitly {@link douyin.EpisodeChatMessage.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.EpisodeChatMessage
     * @static
     * @param {douyin.IEpisodeChatMessage} message EpisodeChatMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    EpisodeChatMessage.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes an EpisodeChatMessage message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.EpisodeChatMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.EpisodeChatMessage} EpisodeChatMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    EpisodeChatMessage.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.EpisodeChatMessage();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.common = $root.douyin.Message.decode(reader, reader.uint32());
            break;
          }
          case 2: {
            message.user = $root.douyin.User.decode(reader, reader.uint32());
            break;
          }
          case 3: {
            message.content = reader.string();
            break;
          }
          case 4: {
            message.visibleToSende = reader.bool();
            break;
          }
          case 7: {
            message.giftImage = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 8: {
            message.agreeMsgId = reader.uint64();
            break;
          }
          case 9: {
            if (!(message.colorValueList && message.colorValueList.length))
              message.colorValueList = [];
            message.colorValueList.push(reader.string());
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes an EpisodeChatMessage message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.EpisodeChatMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.EpisodeChatMessage} EpisodeChatMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    EpisodeChatMessage.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies an EpisodeChatMessage message.
     * @function verify
     * @memberof douyin.EpisodeChatMessage
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    EpisodeChatMessage.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.common != null && message.hasOwnProperty("common")) {
        let error = $root.douyin.Message.verify(message.common);
        if (error) return "common." + error;
      }
      if (message.user != null && message.hasOwnProperty("user")) {
        let error = $root.douyin.User.verify(message.user);
        if (error) return "user." + error;
      }
      if (message.content != null && message.hasOwnProperty("content"))
        if (!$util.isString(message.content)) return "content: string expected";
      if (message.visibleToSende != null && message.hasOwnProperty("visibleToSende"))
        if (typeof message.visibleToSende !== "boolean") return "visibleToSende: boolean expected";
      if (message.giftImage != null && message.hasOwnProperty("giftImage")) {
        let error = $root.douyin.Image.verify(message.giftImage);
        if (error) return "giftImage." + error;
      }
      if (message.agreeMsgId != null && message.hasOwnProperty("agreeMsgId"))
        if (
          !$util.isInteger(message.agreeMsgId) &&
          !(
            message.agreeMsgId &&
            $util.isInteger(message.agreeMsgId.low) &&
            $util.isInteger(message.agreeMsgId.high)
          )
        )
          return "agreeMsgId: integer|Long expected";
      if (message.colorValueList != null && message.hasOwnProperty("colorValueList")) {
        if (!Array.isArray(message.colorValueList)) return "colorValueList: array expected";
        for (let i = 0; i < message.colorValueList.length; ++i)
          if (!$util.isString(message.colorValueList[i]))
            return "colorValueList: string[] expected";
      }
      return null;
    };

    /**
     * Creates an EpisodeChatMessage message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.EpisodeChatMessage
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.EpisodeChatMessage} EpisodeChatMessage
     */
    EpisodeChatMessage.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.EpisodeChatMessage) return object;
      let message = new $root.douyin.EpisodeChatMessage();
      if (object.common != null) {
        if (typeof object.common !== "object")
          throw TypeError(".douyin.EpisodeChatMessage.common: object expected");
        message.common = $root.douyin.Message.fromObject(object.common);
      }
      if (object.user != null) {
        if (typeof object.user !== "object")
          throw TypeError(".douyin.EpisodeChatMessage.user: object expected");
        message.user = $root.douyin.User.fromObject(object.user);
      }
      if (object.content != null) message.content = String(object.content);
      if (object.visibleToSende != null) message.visibleToSende = Boolean(object.visibleToSende);
      if (object.giftImage != null) {
        if (typeof object.giftImage !== "object")
          throw TypeError(".douyin.EpisodeChatMessage.giftImage: object expected");
        message.giftImage = $root.douyin.Image.fromObject(object.giftImage);
      }
      if (object.agreeMsgId != null)
        if ($util.Long)
          (message.agreeMsgId = $util.Long.fromValue(object.agreeMsgId)).unsigned = true;
        else if (typeof object.agreeMsgId === "string")
          message.agreeMsgId = parseInt(object.agreeMsgId, 10);
        else if (typeof object.agreeMsgId === "number") message.agreeMsgId = object.agreeMsgId;
        else if (typeof object.agreeMsgId === "object")
          message.agreeMsgId = new $util.LongBits(
            object.agreeMsgId.low >>> 0,
            object.agreeMsgId.high >>> 0,
          ).toNumber(true);
      if (object.colorValueList) {
        if (!Array.isArray(object.colorValueList))
          throw TypeError(".douyin.EpisodeChatMessage.colorValueList: array expected");
        message.colorValueList = [];
        for (let i = 0; i < object.colorValueList.length; ++i)
          message.colorValueList[i] = String(object.colorValueList[i]);
      }
      return message;
    };

    /**
     * Creates a plain object from an EpisodeChatMessage message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.EpisodeChatMessage
     * @static
     * @param {douyin.EpisodeChatMessage} message EpisodeChatMessage
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    EpisodeChatMessage.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.colorValueList = [];
      if (options.defaults) {
        object.common = null;
        object.user = null;
        object.content = "";
        object.visibleToSende = false;
        object.giftImage = null;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.agreeMsgId =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.agreeMsgId = options.longs === String ? "0" : 0;
      }
      if (message.common != null && message.hasOwnProperty("common"))
        object.common = $root.douyin.Message.toObject(message.common, options);
      if (message.user != null && message.hasOwnProperty("user"))
        object.user = $root.douyin.User.toObject(message.user, options);
      if (message.content != null && message.hasOwnProperty("content"))
        object.content = message.content;
      if (message.visibleToSende != null && message.hasOwnProperty("visibleToSende"))
        object.visibleToSende = message.visibleToSende;
      if (message.giftImage != null && message.hasOwnProperty("giftImage"))
        object.giftImage = $root.douyin.Image.toObject(message.giftImage, options);
      if (message.agreeMsgId != null && message.hasOwnProperty("agreeMsgId"))
        if (typeof message.agreeMsgId === "number")
          object.agreeMsgId =
            options.longs === String ? String(message.agreeMsgId) : message.agreeMsgId;
        else
          object.agreeMsgId =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.agreeMsgId)
              : options.longs === Number
                ? new $util.LongBits(
                    message.agreeMsgId.low >>> 0,
                    message.agreeMsgId.high >>> 0,
                  ).toNumber(true)
                : message.agreeMsgId;
      if (message.colorValueList && message.colorValueList.length) {
        object.colorValueList = [];
        for (let j = 0; j < message.colorValueList.length; ++j)
          object.colorValueList[j] = message.colorValueList[j];
      }
      return object;
    };

    /**
     * Converts this EpisodeChatMessage to JSON.
     * @function toJSON
     * @memberof douyin.EpisodeChatMessage
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    EpisodeChatMessage.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for EpisodeChatMessage
     * @function getTypeUrl
     * @memberof douyin.EpisodeChatMessage
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    EpisodeChatMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.EpisodeChatMessage";
    };

    return EpisodeChatMessage;
  })();

  douyin.MatchAgainstScoreMessage = (function () {
    /**
     * Properties of a MatchAgainstScoreMessage.
     * @memberof douyin
     * @interface IMatchAgainstScoreMessage
     * @property {douyin.ICommon|null} [common] MatchAgainstScoreMessage common
     * @property {douyin.IAgainst|null} [against] MatchAgainstScoreMessage against
     * @property {number|null} [matchStatus] MatchAgainstScoreMessage matchStatus
     * @property {number|null} [displayStatus] MatchAgainstScoreMessage displayStatus
     */

    /**
     * Constructs a new MatchAgainstScoreMessage.
     * @memberof douyin
     * @classdesc Represents a MatchAgainstScoreMessage.
     * @implements IMatchAgainstScoreMessage
     * @constructor
     * @param {douyin.IMatchAgainstScoreMessage=} [properties] Properties to set
     */
    function MatchAgainstScoreMessage(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * MatchAgainstScoreMessage common.
     * @member {douyin.ICommon|null|undefined} common
     * @memberof douyin.MatchAgainstScoreMessage
     * @instance
     */
    MatchAgainstScoreMessage.prototype.common = null;

    /**
     * MatchAgainstScoreMessage against.
     * @member {douyin.IAgainst|null|undefined} against
     * @memberof douyin.MatchAgainstScoreMessage
     * @instance
     */
    MatchAgainstScoreMessage.prototype.against = null;

    /**
     * MatchAgainstScoreMessage matchStatus.
     * @member {number} matchStatus
     * @memberof douyin.MatchAgainstScoreMessage
     * @instance
     */
    MatchAgainstScoreMessage.prototype.matchStatus = 0;

    /**
     * MatchAgainstScoreMessage displayStatus.
     * @member {number} displayStatus
     * @memberof douyin.MatchAgainstScoreMessage
     * @instance
     */
    MatchAgainstScoreMessage.prototype.displayStatus = 0;

    /**
     * Creates a new MatchAgainstScoreMessage instance using the specified properties.
     * @function create
     * @memberof douyin.MatchAgainstScoreMessage
     * @static
     * @param {douyin.IMatchAgainstScoreMessage=} [properties] Properties to set
     * @returns {douyin.MatchAgainstScoreMessage} MatchAgainstScoreMessage instance
     */
    MatchAgainstScoreMessage.create = function create(properties) {
      return new MatchAgainstScoreMessage(properties);
    };

    /**
     * Encodes the specified MatchAgainstScoreMessage message. Does not implicitly {@link douyin.MatchAgainstScoreMessage.verify|verify} messages.
     * @function encode
     * @memberof douyin.MatchAgainstScoreMessage
     * @static
     * @param {douyin.IMatchAgainstScoreMessage} message MatchAgainstScoreMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    MatchAgainstScoreMessage.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.common != null && Object.hasOwnProperty.call(message, "common"))
        $root.douyin.Common.encode(
          message.common,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (message.against != null && Object.hasOwnProperty.call(message, "against"))
        $root.douyin.Against.encode(
          message.against,
          writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
        ).ldelim();
      if (message.matchStatus != null && Object.hasOwnProperty.call(message, "matchStatus"))
        writer.uint32(/* id 3, wireType 0 =*/ 24).uint32(message.matchStatus);
      if (message.displayStatus != null && Object.hasOwnProperty.call(message, "displayStatus"))
        writer.uint32(/* id 4, wireType 0 =*/ 32).uint32(message.displayStatus);
      return writer;
    };

    /**
     * Encodes the specified MatchAgainstScoreMessage message, length delimited. Does not implicitly {@link douyin.MatchAgainstScoreMessage.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.MatchAgainstScoreMessage
     * @static
     * @param {douyin.IMatchAgainstScoreMessage} message MatchAgainstScoreMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    MatchAgainstScoreMessage.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a MatchAgainstScoreMessage message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.MatchAgainstScoreMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.MatchAgainstScoreMessage} MatchAgainstScoreMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    MatchAgainstScoreMessage.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.MatchAgainstScoreMessage();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.common = $root.douyin.Common.decode(reader, reader.uint32());
            break;
          }
          case 2: {
            message.against = $root.douyin.Against.decode(reader, reader.uint32());
            break;
          }
          case 3: {
            message.matchStatus = reader.uint32();
            break;
          }
          case 4: {
            message.displayStatus = reader.uint32();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a MatchAgainstScoreMessage message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.MatchAgainstScoreMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.MatchAgainstScoreMessage} MatchAgainstScoreMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    MatchAgainstScoreMessage.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a MatchAgainstScoreMessage message.
     * @function verify
     * @memberof douyin.MatchAgainstScoreMessage
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    MatchAgainstScoreMessage.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.common != null && message.hasOwnProperty("common")) {
        let error = $root.douyin.Common.verify(message.common);
        if (error) return "common." + error;
      }
      if (message.against != null && message.hasOwnProperty("against")) {
        let error = $root.douyin.Against.verify(message.against);
        if (error) return "against." + error;
      }
      if (message.matchStatus != null && message.hasOwnProperty("matchStatus"))
        if (!$util.isInteger(message.matchStatus)) return "matchStatus: integer expected";
      if (message.displayStatus != null && message.hasOwnProperty("displayStatus"))
        if (!$util.isInteger(message.displayStatus)) return "displayStatus: integer expected";
      return null;
    };

    /**
     * Creates a MatchAgainstScoreMessage message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.MatchAgainstScoreMessage
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.MatchAgainstScoreMessage} MatchAgainstScoreMessage
     */
    MatchAgainstScoreMessage.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.MatchAgainstScoreMessage) return object;
      let message = new $root.douyin.MatchAgainstScoreMessage();
      if (object.common != null) {
        if (typeof object.common !== "object")
          throw TypeError(".douyin.MatchAgainstScoreMessage.common: object expected");
        message.common = $root.douyin.Common.fromObject(object.common);
      }
      if (object.against != null) {
        if (typeof object.against !== "object")
          throw TypeError(".douyin.MatchAgainstScoreMessage.against: object expected");
        message.against = $root.douyin.Against.fromObject(object.against);
      }
      if (object.matchStatus != null) message.matchStatus = object.matchStatus >>> 0;
      if (object.displayStatus != null) message.displayStatus = object.displayStatus >>> 0;
      return message;
    };

    /**
     * Creates a plain object from a MatchAgainstScoreMessage message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.MatchAgainstScoreMessage
     * @static
     * @param {douyin.MatchAgainstScoreMessage} message MatchAgainstScoreMessage
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    MatchAgainstScoreMessage.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.common = null;
        object.against = null;
        object.matchStatus = 0;
        object.displayStatus = 0;
      }
      if (message.common != null && message.hasOwnProperty("common"))
        object.common = $root.douyin.Common.toObject(message.common, options);
      if (message.against != null && message.hasOwnProperty("against"))
        object.against = $root.douyin.Against.toObject(message.against, options);
      if (message.matchStatus != null && message.hasOwnProperty("matchStatus"))
        object.matchStatus = message.matchStatus;
      if (message.displayStatus != null && message.hasOwnProperty("displayStatus"))
        object.displayStatus = message.displayStatus;
      return object;
    };

    /**
     * Converts this MatchAgainstScoreMessage to JSON.
     * @function toJSON
     * @memberof douyin.MatchAgainstScoreMessage
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    MatchAgainstScoreMessage.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for MatchAgainstScoreMessage
     * @function getTypeUrl
     * @memberof douyin.MatchAgainstScoreMessage
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    MatchAgainstScoreMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.MatchAgainstScoreMessage";
    };

    return MatchAgainstScoreMessage;
  })();

  douyin.Against = (function () {
    /**
     * Properties of an Against.
     * @memberof douyin
     * @interface IAgainst
     * @property {string|null} [leftName] Against leftName
     * @property {douyin.IImage|null} [leftLogo] Against leftLogo
     * @property {string|null} [leftGoal] Against leftGoal
     * @property {string|null} [rightName] Against rightName
     * @property {douyin.IImage|null} [rightLogo] Against rightLogo
     * @property {string|null} [rightGoal] Against rightGoal
     * @property {number|Long|null} [timestamp] Against timestamp
     * @property {number|Long|null} [version] Against version
     * @property {number|Long|null} [leftTeamId] Against leftTeamId
     * @property {number|Long|null} [rightTeamId] Against rightTeamId
     * @property {number|Long|null} [diffSei2absSecond] Against diffSei2absSecond
     * @property {number|null} [finalGoalStage] Against finalGoalStage
     * @property {number|null} [currentGoalStage] Against currentGoalStage
     * @property {number|null} [leftScoreAddition] Against leftScoreAddition
     * @property {number|null} [rightScoreAddition] Against rightScoreAddition
     * @property {number|Long|null} [leftGoalInt] Against leftGoalInt
     * @property {number|Long|null} [rightGoalInt] Against rightGoalInt
     */

    /**
     * Constructs a new Against.
     * @memberof douyin
     * @classdesc Represents an Against.
     * @implements IAgainst
     * @constructor
     * @param {douyin.IAgainst=} [properties] Properties to set
     */
    function Against(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * Against leftName.
     * @member {string} leftName
     * @memberof douyin.Against
     * @instance
     */
    Against.prototype.leftName = "";

    /**
     * Against leftLogo.
     * @member {douyin.IImage|null|undefined} leftLogo
     * @memberof douyin.Against
     * @instance
     */
    Against.prototype.leftLogo = null;

    /**
     * Against leftGoal.
     * @member {string} leftGoal
     * @memberof douyin.Against
     * @instance
     */
    Against.prototype.leftGoal = "";

    /**
     * Against rightName.
     * @member {string} rightName
     * @memberof douyin.Against
     * @instance
     */
    Against.prototype.rightName = "";

    /**
     * Against rightLogo.
     * @member {douyin.IImage|null|undefined} rightLogo
     * @memberof douyin.Against
     * @instance
     */
    Against.prototype.rightLogo = null;

    /**
     * Against rightGoal.
     * @member {string} rightGoal
     * @memberof douyin.Against
     * @instance
     */
    Against.prototype.rightGoal = "";

    /**
     * Against timestamp.
     * @member {number|Long} timestamp
     * @memberof douyin.Against
     * @instance
     */
    Against.prototype.timestamp = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Against version.
     * @member {number|Long} version
     * @memberof douyin.Against
     * @instance
     */
    Against.prototype.version = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Against leftTeamId.
     * @member {number|Long} leftTeamId
     * @memberof douyin.Against
     * @instance
     */
    Against.prototype.leftTeamId = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Against rightTeamId.
     * @member {number|Long} rightTeamId
     * @memberof douyin.Against
     * @instance
     */
    Against.prototype.rightTeamId = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Against diffSei2absSecond.
     * @member {number|Long} diffSei2absSecond
     * @memberof douyin.Against
     * @instance
     */
    Against.prototype.diffSei2absSecond = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Against finalGoalStage.
     * @member {number} finalGoalStage
     * @memberof douyin.Against
     * @instance
     */
    Against.prototype.finalGoalStage = 0;

    /**
     * Against currentGoalStage.
     * @member {number} currentGoalStage
     * @memberof douyin.Against
     * @instance
     */
    Against.prototype.currentGoalStage = 0;

    /**
     * Against leftScoreAddition.
     * @member {number} leftScoreAddition
     * @memberof douyin.Against
     * @instance
     */
    Against.prototype.leftScoreAddition = 0;

    /**
     * Against rightScoreAddition.
     * @member {number} rightScoreAddition
     * @memberof douyin.Against
     * @instance
     */
    Against.prototype.rightScoreAddition = 0;

    /**
     * Against leftGoalInt.
     * @member {number|Long} leftGoalInt
     * @memberof douyin.Against
     * @instance
     */
    Against.prototype.leftGoalInt = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Against rightGoalInt.
     * @member {number|Long} rightGoalInt
     * @memberof douyin.Against
     * @instance
     */
    Against.prototype.rightGoalInt = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Creates a new Against instance using the specified properties.
     * @function create
     * @memberof douyin.Against
     * @static
     * @param {douyin.IAgainst=} [properties] Properties to set
     * @returns {douyin.Against} Against instance
     */
    Against.create = function create(properties) {
      return new Against(properties);
    };

    /**
     * Encodes the specified Against message. Does not implicitly {@link douyin.Against.verify|verify} messages.
     * @function encode
     * @memberof douyin.Against
     * @static
     * @param {douyin.IAgainst} message Against message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Against.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.leftName != null && Object.hasOwnProperty.call(message, "leftName"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.leftName);
      if (message.leftLogo != null && Object.hasOwnProperty.call(message, "leftLogo"))
        $root.douyin.Image.encode(
          message.leftLogo,
          writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
        ).ldelim();
      if (message.leftGoal != null && Object.hasOwnProperty.call(message, "leftGoal"))
        writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.leftGoal);
      if (message.rightName != null && Object.hasOwnProperty.call(message, "rightName"))
        writer.uint32(/* id 6, wireType 2 =*/ 50).string(message.rightName);
      if (message.rightLogo != null && Object.hasOwnProperty.call(message, "rightLogo"))
        $root.douyin.Image.encode(
          message.rightLogo,
          writer.uint32(/* id 7, wireType 2 =*/ 58).fork(),
        ).ldelim();
      if (message.rightGoal != null && Object.hasOwnProperty.call(message, "rightGoal"))
        writer.uint32(/* id 8, wireType 2 =*/ 66).string(message.rightGoal);
      if (message.timestamp != null && Object.hasOwnProperty.call(message, "timestamp"))
        writer.uint32(/* id 11, wireType 0 =*/ 88).uint64(message.timestamp);
      if (message.version != null && Object.hasOwnProperty.call(message, "version"))
        writer.uint32(/* id 12, wireType 0 =*/ 96).uint64(message.version);
      if (message.leftTeamId != null && Object.hasOwnProperty.call(message, "leftTeamId"))
        writer.uint32(/* id 13, wireType 0 =*/ 104).uint64(message.leftTeamId);
      if (message.rightTeamId != null && Object.hasOwnProperty.call(message, "rightTeamId"))
        writer.uint32(/* id 14, wireType 0 =*/ 112).uint64(message.rightTeamId);
      if (
        message.diffSei2absSecond != null &&
        Object.hasOwnProperty.call(message, "diffSei2absSecond")
      )
        writer.uint32(/* id 15, wireType 0 =*/ 120).uint64(message.diffSei2absSecond);
      if (message.finalGoalStage != null && Object.hasOwnProperty.call(message, "finalGoalStage"))
        writer.uint32(/* id 16, wireType 0 =*/ 128).uint32(message.finalGoalStage);
      if (
        message.currentGoalStage != null &&
        Object.hasOwnProperty.call(message, "currentGoalStage")
      )
        writer.uint32(/* id 17, wireType 0 =*/ 136).uint32(message.currentGoalStage);
      if (
        message.leftScoreAddition != null &&
        Object.hasOwnProperty.call(message, "leftScoreAddition")
      )
        writer.uint32(/* id 18, wireType 0 =*/ 144).uint32(message.leftScoreAddition);
      if (
        message.rightScoreAddition != null &&
        Object.hasOwnProperty.call(message, "rightScoreAddition")
      )
        writer.uint32(/* id 19, wireType 0 =*/ 152).uint32(message.rightScoreAddition);
      if (message.leftGoalInt != null && Object.hasOwnProperty.call(message, "leftGoalInt"))
        writer.uint32(/* id 20, wireType 0 =*/ 160).uint64(message.leftGoalInt);
      if (message.rightGoalInt != null && Object.hasOwnProperty.call(message, "rightGoalInt"))
        writer.uint32(/* id 21, wireType 0 =*/ 168).uint64(message.rightGoalInt);
      return writer;
    };

    /**
     * Encodes the specified Against message, length delimited. Does not implicitly {@link douyin.Against.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.Against
     * @static
     * @param {douyin.IAgainst} message Against message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Against.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes an Against message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.Against
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.Against} Against
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Against.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.Against();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.leftName = reader.string();
            break;
          }
          case 2: {
            message.leftLogo = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 3: {
            message.leftGoal = reader.string();
            break;
          }
          case 6: {
            message.rightName = reader.string();
            break;
          }
          case 7: {
            message.rightLogo = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 8: {
            message.rightGoal = reader.string();
            break;
          }
          case 11: {
            message.timestamp = reader.uint64();
            break;
          }
          case 12: {
            message.version = reader.uint64();
            break;
          }
          case 13: {
            message.leftTeamId = reader.uint64();
            break;
          }
          case 14: {
            message.rightTeamId = reader.uint64();
            break;
          }
          case 15: {
            message.diffSei2absSecond = reader.uint64();
            break;
          }
          case 16: {
            message.finalGoalStage = reader.uint32();
            break;
          }
          case 17: {
            message.currentGoalStage = reader.uint32();
            break;
          }
          case 18: {
            message.leftScoreAddition = reader.uint32();
            break;
          }
          case 19: {
            message.rightScoreAddition = reader.uint32();
            break;
          }
          case 20: {
            message.leftGoalInt = reader.uint64();
            break;
          }
          case 21: {
            message.rightGoalInt = reader.uint64();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes an Against message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.Against
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.Against} Against
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Against.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies an Against message.
     * @function verify
     * @memberof douyin.Against
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Against.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.leftName != null && message.hasOwnProperty("leftName"))
        if (!$util.isString(message.leftName)) return "leftName: string expected";
      if (message.leftLogo != null && message.hasOwnProperty("leftLogo")) {
        let error = $root.douyin.Image.verify(message.leftLogo);
        if (error) return "leftLogo." + error;
      }
      if (message.leftGoal != null && message.hasOwnProperty("leftGoal"))
        if (!$util.isString(message.leftGoal)) return "leftGoal: string expected";
      if (message.rightName != null && message.hasOwnProperty("rightName"))
        if (!$util.isString(message.rightName)) return "rightName: string expected";
      if (message.rightLogo != null && message.hasOwnProperty("rightLogo")) {
        let error = $root.douyin.Image.verify(message.rightLogo);
        if (error) return "rightLogo." + error;
      }
      if (message.rightGoal != null && message.hasOwnProperty("rightGoal"))
        if (!$util.isString(message.rightGoal)) return "rightGoal: string expected";
      if (message.timestamp != null && message.hasOwnProperty("timestamp"))
        if (
          !$util.isInteger(message.timestamp) &&
          !(
            message.timestamp &&
            $util.isInteger(message.timestamp.low) &&
            $util.isInteger(message.timestamp.high)
          )
        )
          return "timestamp: integer|Long expected";
      if (message.version != null && message.hasOwnProperty("version"))
        if (
          !$util.isInteger(message.version) &&
          !(
            message.version &&
            $util.isInteger(message.version.low) &&
            $util.isInteger(message.version.high)
          )
        )
          return "version: integer|Long expected";
      if (message.leftTeamId != null && message.hasOwnProperty("leftTeamId"))
        if (
          !$util.isInteger(message.leftTeamId) &&
          !(
            message.leftTeamId &&
            $util.isInteger(message.leftTeamId.low) &&
            $util.isInteger(message.leftTeamId.high)
          )
        )
          return "leftTeamId: integer|Long expected";
      if (message.rightTeamId != null && message.hasOwnProperty("rightTeamId"))
        if (
          !$util.isInteger(message.rightTeamId) &&
          !(
            message.rightTeamId &&
            $util.isInteger(message.rightTeamId.low) &&
            $util.isInteger(message.rightTeamId.high)
          )
        )
          return "rightTeamId: integer|Long expected";
      if (message.diffSei2absSecond != null && message.hasOwnProperty("diffSei2absSecond"))
        if (
          !$util.isInteger(message.diffSei2absSecond) &&
          !(
            message.diffSei2absSecond &&
            $util.isInteger(message.diffSei2absSecond.low) &&
            $util.isInteger(message.diffSei2absSecond.high)
          )
        )
          return "diffSei2absSecond: integer|Long expected";
      if (message.finalGoalStage != null && message.hasOwnProperty("finalGoalStage"))
        if (!$util.isInteger(message.finalGoalStage)) return "finalGoalStage: integer expected";
      if (message.currentGoalStage != null && message.hasOwnProperty("currentGoalStage"))
        if (!$util.isInteger(message.currentGoalStage)) return "currentGoalStage: integer expected";
      if (message.leftScoreAddition != null && message.hasOwnProperty("leftScoreAddition"))
        if (!$util.isInteger(message.leftScoreAddition))
          return "leftScoreAddition: integer expected";
      if (message.rightScoreAddition != null && message.hasOwnProperty("rightScoreAddition"))
        if (!$util.isInteger(message.rightScoreAddition))
          return "rightScoreAddition: integer expected";
      if (message.leftGoalInt != null && message.hasOwnProperty("leftGoalInt"))
        if (
          !$util.isInteger(message.leftGoalInt) &&
          !(
            message.leftGoalInt &&
            $util.isInteger(message.leftGoalInt.low) &&
            $util.isInteger(message.leftGoalInt.high)
          )
        )
          return "leftGoalInt: integer|Long expected";
      if (message.rightGoalInt != null && message.hasOwnProperty("rightGoalInt"))
        if (
          !$util.isInteger(message.rightGoalInt) &&
          !(
            message.rightGoalInt &&
            $util.isInteger(message.rightGoalInt.low) &&
            $util.isInteger(message.rightGoalInt.high)
          )
        )
          return "rightGoalInt: integer|Long expected";
      return null;
    };

    /**
     * Creates an Against message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.Against
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.Against} Against
     */
    Against.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.Against) return object;
      let message = new $root.douyin.Against();
      if (object.leftName != null) message.leftName = String(object.leftName);
      if (object.leftLogo != null) {
        if (typeof object.leftLogo !== "object")
          throw TypeError(".douyin.Against.leftLogo: object expected");
        message.leftLogo = $root.douyin.Image.fromObject(object.leftLogo);
      }
      if (object.leftGoal != null) message.leftGoal = String(object.leftGoal);
      if (object.rightName != null) message.rightName = String(object.rightName);
      if (object.rightLogo != null) {
        if (typeof object.rightLogo !== "object")
          throw TypeError(".douyin.Against.rightLogo: object expected");
        message.rightLogo = $root.douyin.Image.fromObject(object.rightLogo);
      }
      if (object.rightGoal != null) message.rightGoal = String(object.rightGoal);
      if (object.timestamp != null)
        if ($util.Long)
          (message.timestamp = $util.Long.fromValue(object.timestamp)).unsigned = true;
        else if (typeof object.timestamp === "string")
          message.timestamp = parseInt(object.timestamp, 10);
        else if (typeof object.timestamp === "number") message.timestamp = object.timestamp;
        else if (typeof object.timestamp === "object")
          message.timestamp = new $util.LongBits(
            object.timestamp.low >>> 0,
            object.timestamp.high >>> 0,
          ).toNumber(true);
      if (object.version != null)
        if ($util.Long) (message.version = $util.Long.fromValue(object.version)).unsigned = true;
        else if (typeof object.version === "string") message.version = parseInt(object.version, 10);
        else if (typeof object.version === "number") message.version = object.version;
        else if (typeof object.version === "object")
          message.version = new $util.LongBits(
            object.version.low >>> 0,
            object.version.high >>> 0,
          ).toNumber(true);
      if (object.leftTeamId != null)
        if ($util.Long)
          (message.leftTeamId = $util.Long.fromValue(object.leftTeamId)).unsigned = true;
        else if (typeof object.leftTeamId === "string")
          message.leftTeamId = parseInt(object.leftTeamId, 10);
        else if (typeof object.leftTeamId === "number") message.leftTeamId = object.leftTeamId;
        else if (typeof object.leftTeamId === "object")
          message.leftTeamId = new $util.LongBits(
            object.leftTeamId.low >>> 0,
            object.leftTeamId.high >>> 0,
          ).toNumber(true);
      if (object.rightTeamId != null)
        if ($util.Long)
          (message.rightTeamId = $util.Long.fromValue(object.rightTeamId)).unsigned = true;
        else if (typeof object.rightTeamId === "string")
          message.rightTeamId = parseInt(object.rightTeamId, 10);
        else if (typeof object.rightTeamId === "number") message.rightTeamId = object.rightTeamId;
        else if (typeof object.rightTeamId === "object")
          message.rightTeamId = new $util.LongBits(
            object.rightTeamId.low >>> 0,
            object.rightTeamId.high >>> 0,
          ).toNumber(true);
      if (object.diffSei2absSecond != null)
        if ($util.Long)
          (message.diffSei2absSecond = $util.Long.fromValue(object.diffSei2absSecond)).unsigned =
            true;
        else if (typeof object.diffSei2absSecond === "string")
          message.diffSei2absSecond = parseInt(object.diffSei2absSecond, 10);
        else if (typeof object.diffSei2absSecond === "number")
          message.diffSei2absSecond = object.diffSei2absSecond;
        else if (typeof object.diffSei2absSecond === "object")
          message.diffSei2absSecond = new $util.LongBits(
            object.diffSei2absSecond.low >>> 0,
            object.diffSei2absSecond.high >>> 0,
          ).toNumber(true);
      if (object.finalGoalStage != null) message.finalGoalStage = object.finalGoalStage >>> 0;
      if (object.currentGoalStage != null) message.currentGoalStage = object.currentGoalStage >>> 0;
      if (object.leftScoreAddition != null)
        message.leftScoreAddition = object.leftScoreAddition >>> 0;
      if (object.rightScoreAddition != null)
        message.rightScoreAddition = object.rightScoreAddition >>> 0;
      if (object.leftGoalInt != null)
        if ($util.Long)
          (message.leftGoalInt = $util.Long.fromValue(object.leftGoalInt)).unsigned = true;
        else if (typeof object.leftGoalInt === "string")
          message.leftGoalInt = parseInt(object.leftGoalInt, 10);
        else if (typeof object.leftGoalInt === "number") message.leftGoalInt = object.leftGoalInt;
        else if (typeof object.leftGoalInt === "object")
          message.leftGoalInt = new $util.LongBits(
            object.leftGoalInt.low >>> 0,
            object.leftGoalInt.high >>> 0,
          ).toNumber(true);
      if (object.rightGoalInt != null)
        if ($util.Long)
          (message.rightGoalInt = $util.Long.fromValue(object.rightGoalInt)).unsigned = true;
        else if (typeof object.rightGoalInt === "string")
          message.rightGoalInt = parseInt(object.rightGoalInt, 10);
        else if (typeof object.rightGoalInt === "number")
          message.rightGoalInt = object.rightGoalInt;
        else if (typeof object.rightGoalInt === "object")
          message.rightGoalInt = new $util.LongBits(
            object.rightGoalInt.low >>> 0,
            object.rightGoalInt.high >>> 0,
          ).toNumber(true);
      return message;
    };

    /**
     * Creates a plain object from an Against message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.Against
     * @static
     * @param {douyin.Against} message Against
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Against.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.leftName = "";
        object.leftLogo = null;
        object.leftGoal = "";
        object.rightName = "";
        object.rightLogo = null;
        object.rightGoal = "";
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.timestamp =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.timestamp = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.version =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.version = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.leftTeamId =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.leftTeamId = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.rightTeamId =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.rightTeamId = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.diffSei2absSecond =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.diffSei2absSecond = options.longs === String ? "0" : 0;
        object.finalGoalStage = 0;
        object.currentGoalStage = 0;
        object.leftScoreAddition = 0;
        object.rightScoreAddition = 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.leftGoalInt =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.leftGoalInt = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.rightGoalInt =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.rightGoalInt = options.longs === String ? "0" : 0;
      }
      if (message.leftName != null && message.hasOwnProperty("leftName"))
        object.leftName = message.leftName;
      if (message.leftLogo != null && message.hasOwnProperty("leftLogo"))
        object.leftLogo = $root.douyin.Image.toObject(message.leftLogo, options);
      if (message.leftGoal != null && message.hasOwnProperty("leftGoal"))
        object.leftGoal = message.leftGoal;
      if (message.rightName != null && message.hasOwnProperty("rightName"))
        object.rightName = message.rightName;
      if (message.rightLogo != null && message.hasOwnProperty("rightLogo"))
        object.rightLogo = $root.douyin.Image.toObject(message.rightLogo, options);
      if (message.rightGoal != null && message.hasOwnProperty("rightGoal"))
        object.rightGoal = message.rightGoal;
      if (message.timestamp != null && message.hasOwnProperty("timestamp"))
        if (typeof message.timestamp === "number")
          object.timestamp =
            options.longs === String ? String(message.timestamp) : message.timestamp;
        else
          object.timestamp =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.timestamp)
              : options.longs === Number
                ? new $util.LongBits(
                    message.timestamp.low >>> 0,
                    message.timestamp.high >>> 0,
                  ).toNumber(true)
                : message.timestamp;
      if (message.version != null && message.hasOwnProperty("version"))
        if (typeof message.version === "number")
          object.version = options.longs === String ? String(message.version) : message.version;
        else
          object.version =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.version)
              : options.longs === Number
                ? new $util.LongBits(
                    message.version.low >>> 0,
                    message.version.high >>> 0,
                  ).toNumber(true)
                : message.version;
      if (message.leftTeamId != null && message.hasOwnProperty("leftTeamId"))
        if (typeof message.leftTeamId === "number")
          object.leftTeamId =
            options.longs === String ? String(message.leftTeamId) : message.leftTeamId;
        else
          object.leftTeamId =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.leftTeamId)
              : options.longs === Number
                ? new $util.LongBits(
                    message.leftTeamId.low >>> 0,
                    message.leftTeamId.high >>> 0,
                  ).toNumber(true)
                : message.leftTeamId;
      if (message.rightTeamId != null && message.hasOwnProperty("rightTeamId"))
        if (typeof message.rightTeamId === "number")
          object.rightTeamId =
            options.longs === String ? String(message.rightTeamId) : message.rightTeamId;
        else
          object.rightTeamId =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.rightTeamId)
              : options.longs === Number
                ? new $util.LongBits(
                    message.rightTeamId.low >>> 0,
                    message.rightTeamId.high >>> 0,
                  ).toNumber(true)
                : message.rightTeamId;
      if (message.diffSei2absSecond != null && message.hasOwnProperty("diffSei2absSecond"))
        if (typeof message.diffSei2absSecond === "number")
          object.diffSei2absSecond =
            options.longs === String
              ? String(message.diffSei2absSecond)
              : message.diffSei2absSecond;
        else
          object.diffSei2absSecond =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.diffSei2absSecond)
              : options.longs === Number
                ? new $util.LongBits(
                    message.diffSei2absSecond.low >>> 0,
                    message.diffSei2absSecond.high >>> 0,
                  ).toNumber(true)
                : message.diffSei2absSecond;
      if (message.finalGoalStage != null && message.hasOwnProperty("finalGoalStage"))
        object.finalGoalStage = message.finalGoalStage;
      if (message.currentGoalStage != null && message.hasOwnProperty("currentGoalStage"))
        object.currentGoalStage = message.currentGoalStage;
      if (message.leftScoreAddition != null && message.hasOwnProperty("leftScoreAddition"))
        object.leftScoreAddition = message.leftScoreAddition;
      if (message.rightScoreAddition != null && message.hasOwnProperty("rightScoreAddition"))
        object.rightScoreAddition = message.rightScoreAddition;
      if (message.leftGoalInt != null && message.hasOwnProperty("leftGoalInt"))
        if (typeof message.leftGoalInt === "number")
          object.leftGoalInt =
            options.longs === String ? String(message.leftGoalInt) : message.leftGoalInt;
        else
          object.leftGoalInt =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.leftGoalInt)
              : options.longs === Number
                ? new $util.LongBits(
                    message.leftGoalInt.low >>> 0,
                    message.leftGoalInt.high >>> 0,
                  ).toNumber(true)
                : message.leftGoalInt;
      if (message.rightGoalInt != null && message.hasOwnProperty("rightGoalInt"))
        if (typeof message.rightGoalInt === "number")
          object.rightGoalInt =
            options.longs === String ? String(message.rightGoalInt) : message.rightGoalInt;
        else
          object.rightGoalInt =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.rightGoalInt)
              : options.longs === Number
                ? new $util.LongBits(
                    message.rightGoalInt.low >>> 0,
                    message.rightGoalInt.high >>> 0,
                  ).toNumber(true)
                : message.rightGoalInt;
      return object;
    };

    /**
     * Converts this Against to JSON.
     * @function toJSON
     * @memberof douyin.Against
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Against.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Against
     * @function getTypeUrl
     * @memberof douyin.Against
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Against.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.Against";
    };

    return Against;
  })();

  douyin.Common = (function () {
    /**
     * Properties of a Common.
     * @memberof douyin
     * @interface ICommon
     * @property {string|null} [method] Common method
     * @property {number|Long|null} [msgId] Common msgId
     * @property {number|Long|null} [roomId] Common roomId
     * @property {number|Long|null} [createTime] Common createTime
     * @property {number|null} [monitor] Common monitor
     * @property {boolean|null} [isShowMsg] Common isShowMsg
     * @property {string|null} [describe] Common describe
     * @property {number|Long|null} [foldType] Common foldType
     * @property {number|Long|null} [anchorFoldType] Common anchorFoldType
     * @property {number|Long|null} [priorityScore] Common priorityScore
     * @property {string|null} [logId] Common logId
     * @property {string|null} [msgProcessFilterK] Common msgProcessFilterK
     * @property {string|null} [msgProcessFilterV] Common msgProcessFilterV
     * @property {douyin.IUser|null} [user] Common user
     * @property {number|Long|null} [anchorFoldTypeV2] Common anchorFoldTypeV2
     * @property {number|Long|null} [processAtSeiTimeMs] Common processAtSeiTimeMs
     * @property {number|Long|null} [randomDispatchMs] Common randomDispatchMs
     * @property {boolean|null} [isDispatch] Common isDispatch
     * @property {number|Long|null} [channelId] Common channelId
     * @property {number|Long|null} [diffSei2absSecond] Common diffSei2absSecond
     * @property {number|Long|null} [anchorFoldDuration] Common anchorFoldDuration
     */

    /**
     * Constructs a new Common.
     * @memberof douyin
     * @classdesc Represents a Common.
     * @implements ICommon
     * @constructor
     * @param {douyin.ICommon=} [properties] Properties to set
     */
    function Common(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * Common method.
     * @member {string} method
     * @memberof douyin.Common
     * @instance
     */
    Common.prototype.method = "";

    /**
     * Common msgId.
     * @member {number|Long} msgId
     * @memberof douyin.Common
     * @instance
     */
    Common.prototype.msgId = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Common roomId.
     * @member {number|Long} roomId
     * @memberof douyin.Common
     * @instance
     */
    Common.prototype.roomId = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Common createTime.
     * @member {number|Long} createTime
     * @memberof douyin.Common
     * @instance
     */
    Common.prototype.createTime = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Common monitor.
     * @member {number} monitor
     * @memberof douyin.Common
     * @instance
     */
    Common.prototype.monitor = 0;

    /**
     * Common isShowMsg.
     * @member {boolean} isShowMsg
     * @memberof douyin.Common
     * @instance
     */
    Common.prototype.isShowMsg = false;

    /**
     * Common describe.
     * @member {string} describe
     * @memberof douyin.Common
     * @instance
     */
    Common.prototype.describe = "";

    /**
     * Common foldType.
     * @member {number|Long} foldType
     * @memberof douyin.Common
     * @instance
     */
    Common.prototype.foldType = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Common anchorFoldType.
     * @member {number|Long} anchorFoldType
     * @memberof douyin.Common
     * @instance
     */
    Common.prototype.anchorFoldType = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Common priorityScore.
     * @member {number|Long} priorityScore
     * @memberof douyin.Common
     * @instance
     */
    Common.prototype.priorityScore = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Common logId.
     * @member {string} logId
     * @memberof douyin.Common
     * @instance
     */
    Common.prototype.logId = "";

    /**
     * Common msgProcessFilterK.
     * @member {string} msgProcessFilterK
     * @memberof douyin.Common
     * @instance
     */
    Common.prototype.msgProcessFilterK = "";

    /**
     * Common msgProcessFilterV.
     * @member {string} msgProcessFilterV
     * @memberof douyin.Common
     * @instance
     */
    Common.prototype.msgProcessFilterV = "";

    /**
     * Common user.
     * @member {douyin.IUser|null|undefined} user
     * @memberof douyin.Common
     * @instance
     */
    Common.prototype.user = null;

    /**
     * Common anchorFoldTypeV2.
     * @member {number|Long} anchorFoldTypeV2
     * @memberof douyin.Common
     * @instance
     */
    Common.prototype.anchorFoldTypeV2 = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Common processAtSeiTimeMs.
     * @member {number|Long} processAtSeiTimeMs
     * @memberof douyin.Common
     * @instance
     */
    Common.prototype.processAtSeiTimeMs = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Common randomDispatchMs.
     * @member {number|Long} randomDispatchMs
     * @memberof douyin.Common
     * @instance
     */
    Common.prototype.randomDispatchMs = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Common isDispatch.
     * @member {boolean} isDispatch
     * @memberof douyin.Common
     * @instance
     */
    Common.prototype.isDispatch = false;

    /**
     * Common channelId.
     * @member {number|Long} channelId
     * @memberof douyin.Common
     * @instance
     */
    Common.prototype.channelId = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Common diffSei2absSecond.
     * @member {number|Long} diffSei2absSecond
     * @memberof douyin.Common
     * @instance
     */
    Common.prototype.diffSei2absSecond = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Common anchorFoldDuration.
     * @member {number|Long} anchorFoldDuration
     * @memberof douyin.Common
     * @instance
     */
    Common.prototype.anchorFoldDuration = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Creates a new Common instance using the specified properties.
     * @function create
     * @memberof douyin.Common
     * @static
     * @param {douyin.ICommon=} [properties] Properties to set
     * @returns {douyin.Common} Common instance
     */
    Common.create = function create(properties) {
      return new Common(properties);
    };

    /**
     * Encodes the specified Common message. Does not implicitly {@link douyin.Common.verify|verify} messages.
     * @function encode
     * @memberof douyin.Common
     * @static
     * @param {douyin.ICommon} message Common message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Common.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.method != null && Object.hasOwnProperty.call(message, "method"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.method);
      if (message.msgId != null && Object.hasOwnProperty.call(message, "msgId"))
        writer.uint32(/* id 2, wireType 0 =*/ 16).uint64(message.msgId);
      if (message.roomId != null && Object.hasOwnProperty.call(message, "roomId"))
        writer.uint32(/* id 3, wireType 0 =*/ 24).uint64(message.roomId);
      if (message.createTime != null && Object.hasOwnProperty.call(message, "createTime"))
        writer.uint32(/* id 4, wireType 0 =*/ 32).uint64(message.createTime);
      if (message.monitor != null && Object.hasOwnProperty.call(message, "monitor"))
        writer.uint32(/* id 5, wireType 0 =*/ 40).uint32(message.monitor);
      if (message.isShowMsg != null && Object.hasOwnProperty.call(message, "isShowMsg"))
        writer.uint32(/* id 6, wireType 0 =*/ 48).bool(message.isShowMsg);
      if (message.describe != null && Object.hasOwnProperty.call(message, "describe"))
        writer.uint32(/* id 7, wireType 2 =*/ 58).string(message.describe);
      if (message.foldType != null && Object.hasOwnProperty.call(message, "foldType"))
        writer.uint32(/* id 9, wireType 0 =*/ 72).uint64(message.foldType);
      if (message.anchorFoldType != null && Object.hasOwnProperty.call(message, "anchorFoldType"))
        writer.uint32(/* id 10, wireType 0 =*/ 80).uint64(message.anchorFoldType);
      if (message.priorityScore != null && Object.hasOwnProperty.call(message, "priorityScore"))
        writer.uint32(/* id 11, wireType 0 =*/ 88).uint64(message.priorityScore);
      if (message.logId != null && Object.hasOwnProperty.call(message, "logId"))
        writer.uint32(/* id 12, wireType 2 =*/ 98).string(message.logId);
      if (
        message.msgProcessFilterK != null &&
        Object.hasOwnProperty.call(message, "msgProcessFilterK")
      )
        writer.uint32(/* id 13, wireType 2 =*/ 106).string(message.msgProcessFilterK);
      if (
        message.msgProcessFilterV != null &&
        Object.hasOwnProperty.call(message, "msgProcessFilterV")
      )
        writer.uint32(/* id 14, wireType 2 =*/ 114).string(message.msgProcessFilterV);
      if (message.user != null && Object.hasOwnProperty.call(message, "user"))
        $root.douyin.User.encode(
          message.user,
          writer.uint32(/* id 15, wireType 2 =*/ 122).fork(),
        ).ldelim();
      if (
        message.anchorFoldTypeV2 != null &&
        Object.hasOwnProperty.call(message, "anchorFoldTypeV2")
      )
        writer.uint32(/* id 17, wireType 0 =*/ 136).uint64(message.anchorFoldTypeV2);
      if (
        message.processAtSeiTimeMs != null &&
        Object.hasOwnProperty.call(message, "processAtSeiTimeMs")
      )
        writer.uint32(/* id 18, wireType 0 =*/ 144).uint64(message.processAtSeiTimeMs);
      if (
        message.randomDispatchMs != null &&
        Object.hasOwnProperty.call(message, "randomDispatchMs")
      )
        writer.uint32(/* id 19, wireType 0 =*/ 152).uint64(message.randomDispatchMs);
      if (message.isDispatch != null && Object.hasOwnProperty.call(message, "isDispatch"))
        writer.uint32(/* id 20, wireType 0 =*/ 160).bool(message.isDispatch);
      if (message.channelId != null && Object.hasOwnProperty.call(message, "channelId"))
        writer.uint32(/* id 21, wireType 0 =*/ 168).uint64(message.channelId);
      if (
        message.diffSei2absSecond != null &&
        Object.hasOwnProperty.call(message, "diffSei2absSecond")
      )
        writer.uint32(/* id 22, wireType 0 =*/ 176).uint64(message.diffSei2absSecond);
      if (
        message.anchorFoldDuration != null &&
        Object.hasOwnProperty.call(message, "anchorFoldDuration")
      )
        writer.uint32(/* id 23, wireType 0 =*/ 184).uint64(message.anchorFoldDuration);
      return writer;
    };

    /**
     * Encodes the specified Common message, length delimited. Does not implicitly {@link douyin.Common.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.Common
     * @static
     * @param {douyin.ICommon} message Common message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Common.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a Common message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.Common
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.Common} Common
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Common.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.Common();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.method = reader.string();
            break;
          }
          case 2: {
            message.msgId = reader.uint64();
            break;
          }
          case 3: {
            message.roomId = reader.uint64();
            break;
          }
          case 4: {
            message.createTime = reader.uint64();
            break;
          }
          case 5: {
            message.monitor = reader.uint32();
            break;
          }
          case 6: {
            message.isShowMsg = reader.bool();
            break;
          }
          case 7: {
            message.describe = reader.string();
            break;
          }
          case 9: {
            message.foldType = reader.uint64();
            break;
          }
          case 10: {
            message.anchorFoldType = reader.uint64();
            break;
          }
          case 11: {
            message.priorityScore = reader.uint64();
            break;
          }
          case 12: {
            message.logId = reader.string();
            break;
          }
          case 13: {
            message.msgProcessFilterK = reader.string();
            break;
          }
          case 14: {
            message.msgProcessFilterV = reader.string();
            break;
          }
          case 15: {
            message.user = $root.douyin.User.decode(reader, reader.uint32());
            break;
          }
          case 17: {
            message.anchorFoldTypeV2 = reader.uint64();
            break;
          }
          case 18: {
            message.processAtSeiTimeMs = reader.uint64();
            break;
          }
          case 19: {
            message.randomDispatchMs = reader.uint64();
            break;
          }
          case 20: {
            message.isDispatch = reader.bool();
            break;
          }
          case 21: {
            message.channelId = reader.uint64();
            break;
          }
          case 22: {
            message.diffSei2absSecond = reader.uint64();
            break;
          }
          case 23: {
            message.anchorFoldDuration = reader.uint64();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a Common message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.Common
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.Common} Common
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Common.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a Common message.
     * @function verify
     * @memberof douyin.Common
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Common.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.method != null && message.hasOwnProperty("method"))
        if (!$util.isString(message.method)) return "method: string expected";
      if (message.msgId != null && message.hasOwnProperty("msgId"))
        if (
          !$util.isInteger(message.msgId) &&
          !(
            message.msgId &&
            $util.isInteger(message.msgId.low) &&
            $util.isInteger(message.msgId.high)
          )
        )
          return "msgId: integer|Long expected";
      if (message.roomId != null && message.hasOwnProperty("roomId"))
        if (
          !$util.isInteger(message.roomId) &&
          !(
            message.roomId &&
            $util.isInteger(message.roomId.low) &&
            $util.isInteger(message.roomId.high)
          )
        )
          return "roomId: integer|Long expected";
      if (message.createTime != null && message.hasOwnProperty("createTime"))
        if (
          !$util.isInteger(message.createTime) &&
          !(
            message.createTime &&
            $util.isInteger(message.createTime.low) &&
            $util.isInteger(message.createTime.high)
          )
        )
          return "createTime: integer|Long expected";
      if (message.monitor != null && message.hasOwnProperty("monitor"))
        if (!$util.isInteger(message.monitor)) return "monitor: integer expected";
      if (message.isShowMsg != null && message.hasOwnProperty("isShowMsg"))
        if (typeof message.isShowMsg !== "boolean") return "isShowMsg: boolean expected";
      if (message.describe != null && message.hasOwnProperty("describe"))
        if (!$util.isString(message.describe)) return "describe: string expected";
      if (message.foldType != null && message.hasOwnProperty("foldType"))
        if (
          !$util.isInteger(message.foldType) &&
          !(
            message.foldType &&
            $util.isInteger(message.foldType.low) &&
            $util.isInteger(message.foldType.high)
          )
        )
          return "foldType: integer|Long expected";
      if (message.anchorFoldType != null && message.hasOwnProperty("anchorFoldType"))
        if (
          !$util.isInteger(message.anchorFoldType) &&
          !(
            message.anchorFoldType &&
            $util.isInteger(message.anchorFoldType.low) &&
            $util.isInteger(message.anchorFoldType.high)
          )
        )
          return "anchorFoldType: integer|Long expected";
      if (message.priorityScore != null && message.hasOwnProperty("priorityScore"))
        if (
          !$util.isInteger(message.priorityScore) &&
          !(
            message.priorityScore &&
            $util.isInteger(message.priorityScore.low) &&
            $util.isInteger(message.priorityScore.high)
          )
        )
          return "priorityScore: integer|Long expected";
      if (message.logId != null && message.hasOwnProperty("logId"))
        if (!$util.isString(message.logId)) return "logId: string expected";
      if (message.msgProcessFilterK != null && message.hasOwnProperty("msgProcessFilterK"))
        if (!$util.isString(message.msgProcessFilterK)) return "msgProcessFilterK: string expected";
      if (message.msgProcessFilterV != null && message.hasOwnProperty("msgProcessFilterV"))
        if (!$util.isString(message.msgProcessFilterV)) return "msgProcessFilterV: string expected";
      if (message.user != null && message.hasOwnProperty("user")) {
        let error = $root.douyin.User.verify(message.user);
        if (error) return "user." + error;
      }
      if (message.anchorFoldTypeV2 != null && message.hasOwnProperty("anchorFoldTypeV2"))
        if (
          !$util.isInteger(message.anchorFoldTypeV2) &&
          !(
            message.anchorFoldTypeV2 &&
            $util.isInteger(message.anchorFoldTypeV2.low) &&
            $util.isInteger(message.anchorFoldTypeV2.high)
          )
        )
          return "anchorFoldTypeV2: integer|Long expected";
      if (message.processAtSeiTimeMs != null && message.hasOwnProperty("processAtSeiTimeMs"))
        if (
          !$util.isInteger(message.processAtSeiTimeMs) &&
          !(
            message.processAtSeiTimeMs &&
            $util.isInteger(message.processAtSeiTimeMs.low) &&
            $util.isInteger(message.processAtSeiTimeMs.high)
          )
        )
          return "processAtSeiTimeMs: integer|Long expected";
      if (message.randomDispatchMs != null && message.hasOwnProperty("randomDispatchMs"))
        if (
          !$util.isInteger(message.randomDispatchMs) &&
          !(
            message.randomDispatchMs &&
            $util.isInteger(message.randomDispatchMs.low) &&
            $util.isInteger(message.randomDispatchMs.high)
          )
        )
          return "randomDispatchMs: integer|Long expected";
      if (message.isDispatch != null && message.hasOwnProperty("isDispatch"))
        if (typeof message.isDispatch !== "boolean") return "isDispatch: boolean expected";
      if (message.channelId != null && message.hasOwnProperty("channelId"))
        if (
          !$util.isInteger(message.channelId) &&
          !(
            message.channelId &&
            $util.isInteger(message.channelId.low) &&
            $util.isInteger(message.channelId.high)
          )
        )
          return "channelId: integer|Long expected";
      if (message.diffSei2absSecond != null && message.hasOwnProperty("diffSei2absSecond"))
        if (
          !$util.isInteger(message.diffSei2absSecond) &&
          !(
            message.diffSei2absSecond &&
            $util.isInteger(message.diffSei2absSecond.low) &&
            $util.isInteger(message.diffSei2absSecond.high)
          )
        )
          return "diffSei2absSecond: integer|Long expected";
      if (message.anchorFoldDuration != null && message.hasOwnProperty("anchorFoldDuration"))
        if (
          !$util.isInteger(message.anchorFoldDuration) &&
          !(
            message.anchorFoldDuration &&
            $util.isInteger(message.anchorFoldDuration.low) &&
            $util.isInteger(message.anchorFoldDuration.high)
          )
        )
          return "anchorFoldDuration: integer|Long expected";
      return null;
    };

    /**
     * Creates a Common message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.Common
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.Common} Common
     */
    Common.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.Common) return object;
      let message = new $root.douyin.Common();
      if (object.method != null) message.method = String(object.method);
      if (object.msgId != null)
        if ($util.Long) (message.msgId = $util.Long.fromValue(object.msgId)).unsigned = true;
        else if (typeof object.msgId === "string") message.msgId = parseInt(object.msgId, 10);
        else if (typeof object.msgId === "number") message.msgId = object.msgId;
        else if (typeof object.msgId === "object")
          message.msgId = new $util.LongBits(
            object.msgId.low >>> 0,
            object.msgId.high >>> 0,
          ).toNumber(true);
      if (object.roomId != null)
        if ($util.Long) (message.roomId = $util.Long.fromValue(object.roomId)).unsigned = true;
        else if (typeof object.roomId === "string") message.roomId = parseInt(object.roomId, 10);
        else if (typeof object.roomId === "number") message.roomId = object.roomId;
        else if (typeof object.roomId === "object")
          message.roomId = new $util.LongBits(
            object.roomId.low >>> 0,
            object.roomId.high >>> 0,
          ).toNumber(true);
      if (object.createTime != null)
        if ($util.Long)
          (message.createTime = $util.Long.fromValue(object.createTime)).unsigned = true;
        else if (typeof object.createTime === "string")
          message.createTime = parseInt(object.createTime, 10);
        else if (typeof object.createTime === "number") message.createTime = object.createTime;
        else if (typeof object.createTime === "object")
          message.createTime = new $util.LongBits(
            object.createTime.low >>> 0,
            object.createTime.high >>> 0,
          ).toNumber(true);
      if (object.monitor != null) message.monitor = object.monitor >>> 0;
      if (object.isShowMsg != null) message.isShowMsg = Boolean(object.isShowMsg);
      if (object.describe != null) message.describe = String(object.describe);
      if (object.foldType != null)
        if ($util.Long) (message.foldType = $util.Long.fromValue(object.foldType)).unsigned = true;
        else if (typeof object.foldType === "string")
          message.foldType = parseInt(object.foldType, 10);
        else if (typeof object.foldType === "number") message.foldType = object.foldType;
        else if (typeof object.foldType === "object")
          message.foldType = new $util.LongBits(
            object.foldType.low >>> 0,
            object.foldType.high >>> 0,
          ).toNumber(true);
      if (object.anchorFoldType != null)
        if ($util.Long)
          (message.anchorFoldType = $util.Long.fromValue(object.anchorFoldType)).unsigned = true;
        else if (typeof object.anchorFoldType === "string")
          message.anchorFoldType = parseInt(object.anchorFoldType, 10);
        else if (typeof object.anchorFoldType === "number")
          message.anchorFoldType = object.anchorFoldType;
        else if (typeof object.anchorFoldType === "object")
          message.anchorFoldType = new $util.LongBits(
            object.anchorFoldType.low >>> 0,
            object.anchorFoldType.high >>> 0,
          ).toNumber(true);
      if (object.priorityScore != null)
        if ($util.Long)
          (message.priorityScore = $util.Long.fromValue(object.priorityScore)).unsigned = true;
        else if (typeof object.priorityScore === "string")
          message.priorityScore = parseInt(object.priorityScore, 10);
        else if (typeof object.priorityScore === "number")
          message.priorityScore = object.priorityScore;
        else if (typeof object.priorityScore === "object")
          message.priorityScore = new $util.LongBits(
            object.priorityScore.low >>> 0,
            object.priorityScore.high >>> 0,
          ).toNumber(true);
      if (object.logId != null) message.logId = String(object.logId);
      if (object.msgProcessFilterK != null)
        message.msgProcessFilterK = String(object.msgProcessFilterK);
      if (object.msgProcessFilterV != null)
        message.msgProcessFilterV = String(object.msgProcessFilterV);
      if (object.user != null) {
        if (typeof object.user !== "object")
          throw TypeError(".douyin.Common.user: object expected");
        message.user = $root.douyin.User.fromObject(object.user);
      }
      if (object.anchorFoldTypeV2 != null)
        if ($util.Long)
          (message.anchorFoldTypeV2 = $util.Long.fromValue(object.anchorFoldTypeV2)).unsigned =
            true;
        else if (typeof object.anchorFoldTypeV2 === "string")
          message.anchorFoldTypeV2 = parseInt(object.anchorFoldTypeV2, 10);
        else if (typeof object.anchorFoldTypeV2 === "number")
          message.anchorFoldTypeV2 = object.anchorFoldTypeV2;
        else if (typeof object.anchorFoldTypeV2 === "object")
          message.anchorFoldTypeV2 = new $util.LongBits(
            object.anchorFoldTypeV2.low >>> 0,
            object.anchorFoldTypeV2.high >>> 0,
          ).toNumber(true);
      if (object.processAtSeiTimeMs != null)
        if ($util.Long)
          (message.processAtSeiTimeMs = $util.Long.fromValue(object.processAtSeiTimeMs)).unsigned =
            true;
        else if (typeof object.processAtSeiTimeMs === "string")
          message.processAtSeiTimeMs = parseInt(object.processAtSeiTimeMs, 10);
        else if (typeof object.processAtSeiTimeMs === "number")
          message.processAtSeiTimeMs = object.processAtSeiTimeMs;
        else if (typeof object.processAtSeiTimeMs === "object")
          message.processAtSeiTimeMs = new $util.LongBits(
            object.processAtSeiTimeMs.low >>> 0,
            object.processAtSeiTimeMs.high >>> 0,
          ).toNumber(true);
      if (object.randomDispatchMs != null)
        if ($util.Long)
          (message.randomDispatchMs = $util.Long.fromValue(object.randomDispatchMs)).unsigned =
            true;
        else if (typeof object.randomDispatchMs === "string")
          message.randomDispatchMs = parseInt(object.randomDispatchMs, 10);
        else if (typeof object.randomDispatchMs === "number")
          message.randomDispatchMs = object.randomDispatchMs;
        else if (typeof object.randomDispatchMs === "object")
          message.randomDispatchMs = new $util.LongBits(
            object.randomDispatchMs.low >>> 0,
            object.randomDispatchMs.high >>> 0,
          ).toNumber(true);
      if (object.isDispatch != null) message.isDispatch = Boolean(object.isDispatch);
      if (object.channelId != null)
        if ($util.Long)
          (message.channelId = $util.Long.fromValue(object.channelId)).unsigned = true;
        else if (typeof object.channelId === "string")
          message.channelId = parseInt(object.channelId, 10);
        else if (typeof object.channelId === "number") message.channelId = object.channelId;
        else if (typeof object.channelId === "object")
          message.channelId = new $util.LongBits(
            object.channelId.low >>> 0,
            object.channelId.high >>> 0,
          ).toNumber(true);
      if (object.diffSei2absSecond != null)
        if ($util.Long)
          (message.diffSei2absSecond = $util.Long.fromValue(object.diffSei2absSecond)).unsigned =
            true;
        else if (typeof object.diffSei2absSecond === "string")
          message.diffSei2absSecond = parseInt(object.diffSei2absSecond, 10);
        else if (typeof object.diffSei2absSecond === "number")
          message.diffSei2absSecond = object.diffSei2absSecond;
        else if (typeof object.diffSei2absSecond === "object")
          message.diffSei2absSecond = new $util.LongBits(
            object.diffSei2absSecond.low >>> 0,
            object.diffSei2absSecond.high >>> 0,
          ).toNumber(true);
      if (object.anchorFoldDuration != null)
        if ($util.Long)
          (message.anchorFoldDuration = $util.Long.fromValue(object.anchorFoldDuration)).unsigned =
            true;
        else if (typeof object.anchorFoldDuration === "string")
          message.anchorFoldDuration = parseInt(object.anchorFoldDuration, 10);
        else if (typeof object.anchorFoldDuration === "number")
          message.anchorFoldDuration = object.anchorFoldDuration;
        else if (typeof object.anchorFoldDuration === "object")
          message.anchorFoldDuration = new $util.LongBits(
            object.anchorFoldDuration.low >>> 0,
            object.anchorFoldDuration.high >>> 0,
          ).toNumber(true);
      return message;
    };

    /**
     * Creates a plain object from a Common message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.Common
     * @static
     * @param {douyin.Common} message Common
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Common.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.method = "";
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.msgId =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.msgId = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.roomId =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.roomId = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.createTime =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.createTime = options.longs === String ? "0" : 0;
        object.monitor = 0;
        object.isShowMsg = false;
        object.describe = "";
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.foldType =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.foldType = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.anchorFoldType =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.anchorFoldType = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.priorityScore =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.priorityScore = options.longs === String ? "0" : 0;
        object.logId = "";
        object.msgProcessFilterK = "";
        object.msgProcessFilterV = "";
        object.user = null;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.anchorFoldTypeV2 =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.anchorFoldTypeV2 = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.processAtSeiTimeMs =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.processAtSeiTimeMs = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.randomDispatchMs =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.randomDispatchMs = options.longs === String ? "0" : 0;
        object.isDispatch = false;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.channelId =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.channelId = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.diffSei2absSecond =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.diffSei2absSecond = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.anchorFoldDuration =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.anchorFoldDuration = options.longs === String ? "0" : 0;
      }
      if (message.method != null && message.hasOwnProperty("method"))
        object.method = message.method;
      if (message.msgId != null && message.hasOwnProperty("msgId"))
        if (typeof message.msgId === "number")
          object.msgId = options.longs === String ? String(message.msgId) : message.msgId;
        else
          object.msgId =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.msgId)
              : options.longs === Number
                ? new $util.LongBits(message.msgId.low >>> 0, message.msgId.high >>> 0).toNumber(
                    true,
                  )
                : message.msgId;
      if (message.roomId != null && message.hasOwnProperty("roomId"))
        if (typeof message.roomId === "number")
          object.roomId = options.longs === String ? String(message.roomId) : message.roomId;
        else
          object.roomId =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.roomId)
              : options.longs === Number
                ? new $util.LongBits(message.roomId.low >>> 0, message.roomId.high >>> 0).toNumber(
                    true,
                  )
                : message.roomId;
      if (message.createTime != null && message.hasOwnProperty("createTime"))
        if (typeof message.createTime === "number")
          object.createTime =
            options.longs === String ? String(message.createTime) : message.createTime;
        else
          object.createTime =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.createTime)
              : options.longs === Number
                ? new $util.LongBits(
                    message.createTime.low >>> 0,
                    message.createTime.high >>> 0,
                  ).toNumber(true)
                : message.createTime;
      if (message.monitor != null && message.hasOwnProperty("monitor"))
        object.monitor = message.monitor;
      if (message.isShowMsg != null && message.hasOwnProperty("isShowMsg"))
        object.isShowMsg = message.isShowMsg;
      if (message.describe != null && message.hasOwnProperty("describe"))
        object.describe = message.describe;
      if (message.foldType != null && message.hasOwnProperty("foldType"))
        if (typeof message.foldType === "number")
          object.foldType = options.longs === String ? String(message.foldType) : message.foldType;
        else
          object.foldType =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.foldType)
              : options.longs === Number
                ? new $util.LongBits(
                    message.foldType.low >>> 0,
                    message.foldType.high >>> 0,
                  ).toNumber(true)
                : message.foldType;
      if (message.anchorFoldType != null && message.hasOwnProperty("anchorFoldType"))
        if (typeof message.anchorFoldType === "number")
          object.anchorFoldType =
            options.longs === String ? String(message.anchorFoldType) : message.anchorFoldType;
        else
          object.anchorFoldType =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.anchorFoldType)
              : options.longs === Number
                ? new $util.LongBits(
                    message.anchorFoldType.low >>> 0,
                    message.anchorFoldType.high >>> 0,
                  ).toNumber(true)
                : message.anchorFoldType;
      if (message.priorityScore != null && message.hasOwnProperty("priorityScore"))
        if (typeof message.priorityScore === "number")
          object.priorityScore =
            options.longs === String ? String(message.priorityScore) : message.priorityScore;
        else
          object.priorityScore =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.priorityScore)
              : options.longs === Number
                ? new $util.LongBits(
                    message.priorityScore.low >>> 0,
                    message.priorityScore.high >>> 0,
                  ).toNumber(true)
                : message.priorityScore;
      if (message.logId != null && message.hasOwnProperty("logId")) object.logId = message.logId;
      if (message.msgProcessFilterK != null && message.hasOwnProperty("msgProcessFilterK"))
        object.msgProcessFilterK = message.msgProcessFilterK;
      if (message.msgProcessFilterV != null && message.hasOwnProperty("msgProcessFilterV"))
        object.msgProcessFilterV = message.msgProcessFilterV;
      if (message.user != null && message.hasOwnProperty("user"))
        object.user = $root.douyin.User.toObject(message.user, options);
      if (message.anchorFoldTypeV2 != null && message.hasOwnProperty("anchorFoldTypeV2"))
        if (typeof message.anchorFoldTypeV2 === "number")
          object.anchorFoldTypeV2 =
            options.longs === String ? String(message.anchorFoldTypeV2) : message.anchorFoldTypeV2;
        else
          object.anchorFoldTypeV2 =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.anchorFoldTypeV2)
              : options.longs === Number
                ? new $util.LongBits(
                    message.anchorFoldTypeV2.low >>> 0,
                    message.anchorFoldTypeV2.high >>> 0,
                  ).toNumber(true)
                : message.anchorFoldTypeV2;
      if (message.processAtSeiTimeMs != null && message.hasOwnProperty("processAtSeiTimeMs"))
        if (typeof message.processAtSeiTimeMs === "number")
          object.processAtSeiTimeMs =
            options.longs === String
              ? String(message.processAtSeiTimeMs)
              : message.processAtSeiTimeMs;
        else
          object.processAtSeiTimeMs =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.processAtSeiTimeMs)
              : options.longs === Number
                ? new $util.LongBits(
                    message.processAtSeiTimeMs.low >>> 0,
                    message.processAtSeiTimeMs.high >>> 0,
                  ).toNumber(true)
                : message.processAtSeiTimeMs;
      if (message.randomDispatchMs != null && message.hasOwnProperty("randomDispatchMs"))
        if (typeof message.randomDispatchMs === "number")
          object.randomDispatchMs =
            options.longs === String ? String(message.randomDispatchMs) : message.randomDispatchMs;
        else
          object.randomDispatchMs =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.randomDispatchMs)
              : options.longs === Number
                ? new $util.LongBits(
                    message.randomDispatchMs.low >>> 0,
                    message.randomDispatchMs.high >>> 0,
                  ).toNumber(true)
                : message.randomDispatchMs;
      if (message.isDispatch != null && message.hasOwnProperty("isDispatch"))
        object.isDispatch = message.isDispatch;
      if (message.channelId != null && message.hasOwnProperty("channelId"))
        if (typeof message.channelId === "number")
          object.channelId =
            options.longs === String ? String(message.channelId) : message.channelId;
        else
          object.channelId =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.channelId)
              : options.longs === Number
                ? new $util.LongBits(
                    message.channelId.low >>> 0,
                    message.channelId.high >>> 0,
                  ).toNumber(true)
                : message.channelId;
      if (message.diffSei2absSecond != null && message.hasOwnProperty("diffSei2absSecond"))
        if (typeof message.diffSei2absSecond === "number")
          object.diffSei2absSecond =
            options.longs === String
              ? String(message.diffSei2absSecond)
              : message.diffSei2absSecond;
        else
          object.diffSei2absSecond =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.diffSei2absSecond)
              : options.longs === Number
                ? new $util.LongBits(
                    message.diffSei2absSecond.low >>> 0,
                    message.diffSei2absSecond.high >>> 0,
                  ).toNumber(true)
                : message.diffSei2absSecond;
      if (message.anchorFoldDuration != null && message.hasOwnProperty("anchorFoldDuration"))
        if (typeof message.anchorFoldDuration === "number")
          object.anchorFoldDuration =
            options.longs === String
              ? String(message.anchorFoldDuration)
              : message.anchorFoldDuration;
        else
          object.anchorFoldDuration =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.anchorFoldDuration)
              : options.longs === Number
                ? new $util.LongBits(
                    message.anchorFoldDuration.low >>> 0,
                    message.anchorFoldDuration.high >>> 0,
                  ).toNumber(true)
                : message.anchorFoldDuration;
      return object;
    };

    /**
     * Converts this Common to JSON.
     * @function toJSON
     * @memberof douyin.Common
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Common.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Common
     * @function getTypeUrl
     * @memberof douyin.Common
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Common.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.Common";
    };

    return Common;
  })();

  douyin.User = (function () {
    /**
     * Properties of a User.
     * @memberof douyin
     * @interface IUser
     * @property {number|Long|null} [id] User id
     * @property {number|Long|null} [shortId] User shortId
     * @property {string|null} [nickName] User nickName
     * @property {number|null} [gender] User gender
     * @property {string|null} [Signature] User Signature
     * @property {number|null} [Level] User Level
     * @property {number|Long|null} [Birthday] User Birthday
     * @property {string|null} [Telephone] User Telephone
     * @property {douyin.IImage|null} [AvatarThumb] User AvatarThumb
     * @property {douyin.IImage|null} [AvatarMedium] User AvatarMedium
     * @property {douyin.IImage|null} [AvatarLarge] User AvatarLarge
     * @property {boolean|null} [Verified] User Verified
     * @property {number|null} [Experience] User Experience
     * @property {string|null} [city] User city
     * @property {number|null} [Status] User Status
     * @property {number|Long|null} [CreateTime] User CreateTime
     * @property {number|Long|null} [ModifyTime] User ModifyTime
     * @property {number|null} [Secret] User Secret
     * @property {string|null} [ShareQrcodeUri] User ShareQrcodeUri
     * @property {number|null} [IncomeSharePercent] User IncomeSharePercent
     * @property {Array.<douyin.IImage>|null} [BadgeImageList] User BadgeImageList
     * @property {string|null} [SpecialId] User SpecialId
     * @property {douyin.IImage|null} [AvatarBorder] User AvatarBorder
     * @property {douyin.IImage|null} [Medal] User Medal
     * @property {Array.<douyin.IImage>|null} [RealTimeIconsList] User RealTimeIconsList
     */

    /**
     * Constructs a new User.
     * @memberof douyin
     * @classdesc Represents a User.
     * @implements IUser
     * @constructor
     * @param {douyin.IUser=} [properties] Properties to set
     */
    function User(properties) {
      this.BadgeImageList = [];
      this.RealTimeIconsList = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * User id.
     * @member {number|Long} id
     * @memberof douyin.User
     * @instance
     */
    User.prototype.id = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * User shortId.
     * @member {number|Long} shortId
     * @memberof douyin.User
     * @instance
     */
    User.prototype.shortId = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * User nickName.
     * @member {string} nickName
     * @memberof douyin.User
     * @instance
     */
    User.prototype.nickName = "";

    /**
     * User gender.
     * @member {number} gender
     * @memberof douyin.User
     * @instance
     */
    User.prototype.gender = 0;

    /**
     * User Signature.
     * @member {string} Signature
     * @memberof douyin.User
     * @instance
     */
    User.prototype.Signature = "";

    /**
     * User Level.
     * @member {number} Level
     * @memberof douyin.User
     * @instance
     */
    User.prototype.Level = 0;

    /**
     * User Birthday.
     * @member {number|Long} Birthday
     * @memberof douyin.User
     * @instance
     */
    User.prototype.Birthday = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * User Telephone.
     * @member {string} Telephone
     * @memberof douyin.User
     * @instance
     */
    User.prototype.Telephone = "";

    /**
     * User AvatarThumb.
     * @member {douyin.IImage|null|undefined} AvatarThumb
     * @memberof douyin.User
     * @instance
     */
    User.prototype.AvatarThumb = null;

    /**
     * User AvatarMedium.
     * @member {douyin.IImage|null|undefined} AvatarMedium
     * @memberof douyin.User
     * @instance
     */
    User.prototype.AvatarMedium = null;

    /**
     * User AvatarLarge.
     * @member {douyin.IImage|null|undefined} AvatarLarge
     * @memberof douyin.User
     * @instance
     */
    User.prototype.AvatarLarge = null;

    /**
     * User Verified.
     * @member {boolean} Verified
     * @memberof douyin.User
     * @instance
     */
    User.prototype.Verified = false;

    /**
     * User Experience.
     * @member {number} Experience
     * @memberof douyin.User
     * @instance
     */
    User.prototype.Experience = 0;

    /**
     * User city.
     * @member {string} city
     * @memberof douyin.User
     * @instance
     */
    User.prototype.city = "";

    /**
     * User Status.
     * @member {number} Status
     * @memberof douyin.User
     * @instance
     */
    User.prototype.Status = 0;

    /**
     * User CreateTime.
     * @member {number|Long} CreateTime
     * @memberof douyin.User
     * @instance
     */
    User.prototype.CreateTime = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * User ModifyTime.
     * @member {number|Long} ModifyTime
     * @memberof douyin.User
     * @instance
     */
    User.prototype.ModifyTime = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * User Secret.
     * @member {number} Secret
     * @memberof douyin.User
     * @instance
     */
    User.prototype.Secret = 0;

    /**
     * User ShareQrcodeUri.
     * @member {string} ShareQrcodeUri
     * @memberof douyin.User
     * @instance
     */
    User.prototype.ShareQrcodeUri = "";

    /**
     * User IncomeSharePercent.
     * @member {number} IncomeSharePercent
     * @memberof douyin.User
     * @instance
     */
    User.prototype.IncomeSharePercent = 0;

    /**
     * User BadgeImageList.
     * @member {Array.<douyin.IImage>} BadgeImageList
     * @memberof douyin.User
     * @instance
     */
    User.prototype.BadgeImageList = $util.emptyArray;

    /**
     * User SpecialId.
     * @member {string} SpecialId
     * @memberof douyin.User
     * @instance
     */
    User.prototype.SpecialId = "";

    /**
     * User AvatarBorder.
     * @member {douyin.IImage|null|undefined} AvatarBorder
     * @memberof douyin.User
     * @instance
     */
    User.prototype.AvatarBorder = null;

    /**
     * User Medal.
     * @member {douyin.IImage|null|undefined} Medal
     * @memberof douyin.User
     * @instance
     */
    User.prototype.Medal = null;

    /**
     * User RealTimeIconsList.
     * @member {Array.<douyin.IImage>} RealTimeIconsList
     * @memberof douyin.User
     * @instance
     */
    User.prototype.RealTimeIconsList = $util.emptyArray;

    /**
     * Creates a new User instance using the specified properties.
     * @function create
     * @memberof douyin.User
     * @static
     * @param {douyin.IUser=} [properties] Properties to set
     * @returns {douyin.User} User instance
     */
    User.create = function create(properties) {
      return new User(properties);
    };

    /**
     * Encodes the specified User message. Does not implicitly {@link douyin.User.verify|verify} messages.
     * @function encode
     * @memberof douyin.User
     * @static
     * @param {douyin.IUser} message User message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    User.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.id != null && Object.hasOwnProperty.call(message, "id"))
        writer.uint32(/* id 1, wireType 0 =*/ 8).uint64(message.id);
      if (message.shortId != null && Object.hasOwnProperty.call(message, "shortId"))
        writer.uint32(/* id 2, wireType 0 =*/ 16).uint64(message.shortId);
      if (message.nickName != null && Object.hasOwnProperty.call(message, "nickName"))
        writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.nickName);
      if (message.gender != null && Object.hasOwnProperty.call(message, "gender"))
        writer.uint32(/* id 4, wireType 0 =*/ 32).uint32(message.gender);
      if (message.Signature != null && Object.hasOwnProperty.call(message, "Signature"))
        writer.uint32(/* id 5, wireType 2 =*/ 42).string(message.Signature);
      if (message.Level != null && Object.hasOwnProperty.call(message, "Level"))
        writer.uint32(/* id 6, wireType 0 =*/ 48).uint32(message.Level);
      if (message.Birthday != null && Object.hasOwnProperty.call(message, "Birthday"))
        writer.uint32(/* id 7, wireType 0 =*/ 56).uint64(message.Birthday);
      if (message.Telephone != null && Object.hasOwnProperty.call(message, "Telephone"))
        writer.uint32(/* id 8, wireType 2 =*/ 66).string(message.Telephone);
      if (message.AvatarThumb != null && Object.hasOwnProperty.call(message, "AvatarThumb"))
        $root.douyin.Image.encode(
          message.AvatarThumb,
          writer.uint32(/* id 9, wireType 2 =*/ 74).fork(),
        ).ldelim();
      if (message.AvatarMedium != null && Object.hasOwnProperty.call(message, "AvatarMedium"))
        $root.douyin.Image.encode(
          message.AvatarMedium,
          writer.uint32(/* id 10, wireType 2 =*/ 82).fork(),
        ).ldelim();
      if (message.AvatarLarge != null && Object.hasOwnProperty.call(message, "AvatarLarge"))
        $root.douyin.Image.encode(
          message.AvatarLarge,
          writer.uint32(/* id 11, wireType 2 =*/ 90).fork(),
        ).ldelim();
      if (message.Verified != null && Object.hasOwnProperty.call(message, "Verified"))
        writer.uint32(/* id 12, wireType 0 =*/ 96).bool(message.Verified);
      if (message.Experience != null && Object.hasOwnProperty.call(message, "Experience"))
        writer.uint32(/* id 13, wireType 0 =*/ 104).uint32(message.Experience);
      if (message.city != null && Object.hasOwnProperty.call(message, "city"))
        writer.uint32(/* id 14, wireType 2 =*/ 114).string(message.city);
      if (message.Status != null && Object.hasOwnProperty.call(message, "Status"))
        writer.uint32(/* id 15, wireType 0 =*/ 120).int32(message.Status);
      if (message.CreateTime != null && Object.hasOwnProperty.call(message, "CreateTime"))
        writer.uint32(/* id 16, wireType 0 =*/ 128).uint64(message.CreateTime);
      if (message.ModifyTime != null && Object.hasOwnProperty.call(message, "ModifyTime"))
        writer.uint32(/* id 17, wireType 0 =*/ 136).uint64(message.ModifyTime);
      if (message.Secret != null && Object.hasOwnProperty.call(message, "Secret"))
        writer.uint32(/* id 18, wireType 0 =*/ 144).uint32(message.Secret);
      if (message.ShareQrcodeUri != null && Object.hasOwnProperty.call(message, "ShareQrcodeUri"))
        writer.uint32(/* id 19, wireType 2 =*/ 154).string(message.ShareQrcodeUri);
      if (
        message.IncomeSharePercent != null &&
        Object.hasOwnProperty.call(message, "IncomeSharePercent")
      )
        writer.uint32(/* id 20, wireType 0 =*/ 160).uint32(message.IncomeSharePercent);
      if (message.BadgeImageList != null && message.BadgeImageList.length)
        for (let i = 0; i < message.BadgeImageList.length; ++i)
          $root.douyin.Image.encode(
            message.BadgeImageList[i],
            writer.uint32(/* id 21, wireType 2 =*/ 170).fork(),
          ).ldelim();
      if (message.SpecialId != null && Object.hasOwnProperty.call(message, "SpecialId"))
        writer.uint32(/* id 26, wireType 2 =*/ 210).string(message.SpecialId);
      if (message.AvatarBorder != null && Object.hasOwnProperty.call(message, "AvatarBorder"))
        $root.douyin.Image.encode(
          message.AvatarBorder,
          writer.uint32(/* id 27, wireType 2 =*/ 218).fork(),
        ).ldelim();
      if (message.Medal != null && Object.hasOwnProperty.call(message, "Medal"))
        $root.douyin.Image.encode(
          message.Medal,
          writer.uint32(/* id 28, wireType 2 =*/ 226).fork(),
        ).ldelim();
      if (message.RealTimeIconsList != null && message.RealTimeIconsList.length)
        for (let i = 0; i < message.RealTimeIconsList.length; ++i)
          $root.douyin.Image.encode(
            message.RealTimeIconsList[i],
            writer.uint32(/* id 29, wireType 2 =*/ 234).fork(),
          ).ldelim();
      return writer;
    };

    /**
     * Encodes the specified User message, length delimited. Does not implicitly {@link douyin.User.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.User
     * @static
     * @param {douyin.IUser} message User message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    User.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a User message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.User
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.User} User
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    User.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.User();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.id = reader.uint64();
            break;
          }
          case 2: {
            message.shortId = reader.uint64();
            break;
          }
          case 3: {
            message.nickName = reader.string();
            break;
          }
          case 4: {
            message.gender = reader.uint32();
            break;
          }
          case 5: {
            message.Signature = reader.string();
            break;
          }
          case 6: {
            message.Level = reader.uint32();
            break;
          }
          case 7: {
            message.Birthday = reader.uint64();
            break;
          }
          case 8: {
            message.Telephone = reader.string();
            break;
          }
          case 9: {
            message.AvatarThumb = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 10: {
            message.AvatarMedium = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 11: {
            message.AvatarLarge = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 12: {
            message.Verified = reader.bool();
            break;
          }
          case 13: {
            message.Experience = reader.uint32();
            break;
          }
          case 14: {
            message.city = reader.string();
            break;
          }
          case 15: {
            message.Status = reader.int32();
            break;
          }
          case 16: {
            message.CreateTime = reader.uint64();
            break;
          }
          case 17: {
            message.ModifyTime = reader.uint64();
            break;
          }
          case 18: {
            message.Secret = reader.uint32();
            break;
          }
          case 19: {
            message.ShareQrcodeUri = reader.string();
            break;
          }
          case 20: {
            message.IncomeSharePercent = reader.uint32();
            break;
          }
          case 21: {
            if (!(message.BadgeImageList && message.BadgeImageList.length))
              message.BadgeImageList = [];
            message.BadgeImageList.push($root.douyin.Image.decode(reader, reader.uint32()));
            break;
          }
          case 26: {
            message.SpecialId = reader.string();
            break;
          }
          case 27: {
            message.AvatarBorder = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 28: {
            message.Medal = $root.douyin.Image.decode(reader, reader.uint32());
            break;
          }
          case 29: {
            if (!(message.RealTimeIconsList && message.RealTimeIconsList.length))
              message.RealTimeIconsList = [];
            message.RealTimeIconsList.push($root.douyin.Image.decode(reader, reader.uint32()));
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a User message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.User
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.User} User
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    User.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a User message.
     * @function verify
     * @memberof douyin.User
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    User.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.id != null && message.hasOwnProperty("id"))
        if (
          !$util.isInteger(message.id) &&
          !(message.id && $util.isInteger(message.id.low) && $util.isInteger(message.id.high))
        )
          return "id: integer|Long expected";
      if (message.shortId != null && message.hasOwnProperty("shortId"))
        if (
          !$util.isInteger(message.shortId) &&
          !(
            message.shortId &&
            $util.isInteger(message.shortId.low) &&
            $util.isInteger(message.shortId.high)
          )
        )
          return "shortId: integer|Long expected";
      if (message.nickName != null && message.hasOwnProperty("nickName"))
        if (!$util.isString(message.nickName)) return "nickName: string expected";
      if (message.gender != null && message.hasOwnProperty("gender"))
        if (!$util.isInteger(message.gender)) return "gender: integer expected";
      if (message.Signature != null && message.hasOwnProperty("Signature"))
        if (!$util.isString(message.Signature)) return "Signature: string expected";
      if (message.Level != null && message.hasOwnProperty("Level"))
        if (!$util.isInteger(message.Level)) return "Level: integer expected";
      if (message.Birthday != null && message.hasOwnProperty("Birthday"))
        if (
          !$util.isInteger(message.Birthday) &&
          !(
            message.Birthday &&
            $util.isInteger(message.Birthday.low) &&
            $util.isInteger(message.Birthday.high)
          )
        )
          return "Birthday: integer|Long expected";
      if (message.Telephone != null && message.hasOwnProperty("Telephone"))
        if (!$util.isString(message.Telephone)) return "Telephone: string expected";
      if (message.AvatarThumb != null && message.hasOwnProperty("AvatarThumb")) {
        let error = $root.douyin.Image.verify(message.AvatarThumb);
        if (error) return "AvatarThumb." + error;
      }
      if (message.AvatarMedium != null && message.hasOwnProperty("AvatarMedium")) {
        let error = $root.douyin.Image.verify(message.AvatarMedium);
        if (error) return "AvatarMedium." + error;
      }
      if (message.AvatarLarge != null && message.hasOwnProperty("AvatarLarge")) {
        let error = $root.douyin.Image.verify(message.AvatarLarge);
        if (error) return "AvatarLarge." + error;
      }
      if (message.Verified != null && message.hasOwnProperty("Verified"))
        if (typeof message.Verified !== "boolean") return "Verified: boolean expected";
      if (message.Experience != null && message.hasOwnProperty("Experience"))
        if (!$util.isInteger(message.Experience)) return "Experience: integer expected";
      if (message.city != null && message.hasOwnProperty("city"))
        if (!$util.isString(message.city)) return "city: string expected";
      if (message.Status != null && message.hasOwnProperty("Status"))
        if (!$util.isInteger(message.Status)) return "Status: integer expected";
      if (message.CreateTime != null && message.hasOwnProperty("CreateTime"))
        if (
          !$util.isInteger(message.CreateTime) &&
          !(
            message.CreateTime &&
            $util.isInteger(message.CreateTime.low) &&
            $util.isInteger(message.CreateTime.high)
          )
        )
          return "CreateTime: integer|Long expected";
      if (message.ModifyTime != null && message.hasOwnProperty("ModifyTime"))
        if (
          !$util.isInteger(message.ModifyTime) &&
          !(
            message.ModifyTime &&
            $util.isInteger(message.ModifyTime.low) &&
            $util.isInteger(message.ModifyTime.high)
          )
        )
          return "ModifyTime: integer|Long expected";
      if (message.Secret != null && message.hasOwnProperty("Secret"))
        if (!$util.isInteger(message.Secret)) return "Secret: integer expected";
      if (message.ShareQrcodeUri != null && message.hasOwnProperty("ShareQrcodeUri"))
        if (!$util.isString(message.ShareQrcodeUri)) return "ShareQrcodeUri: string expected";
      if (message.IncomeSharePercent != null && message.hasOwnProperty("IncomeSharePercent"))
        if (!$util.isInteger(message.IncomeSharePercent))
          return "IncomeSharePercent: integer expected";
      if (message.BadgeImageList != null && message.hasOwnProperty("BadgeImageList")) {
        if (!Array.isArray(message.BadgeImageList)) return "BadgeImageList: array expected";
        for (let i = 0; i < message.BadgeImageList.length; ++i) {
          let error = $root.douyin.Image.verify(message.BadgeImageList[i]);
          if (error) return "BadgeImageList." + error;
        }
      }
      if (message.SpecialId != null && message.hasOwnProperty("SpecialId"))
        if (!$util.isString(message.SpecialId)) return "SpecialId: string expected";
      if (message.AvatarBorder != null && message.hasOwnProperty("AvatarBorder")) {
        let error = $root.douyin.Image.verify(message.AvatarBorder);
        if (error) return "AvatarBorder." + error;
      }
      if (message.Medal != null && message.hasOwnProperty("Medal")) {
        let error = $root.douyin.Image.verify(message.Medal);
        if (error) return "Medal." + error;
      }
      if (message.RealTimeIconsList != null && message.hasOwnProperty("RealTimeIconsList")) {
        if (!Array.isArray(message.RealTimeIconsList)) return "RealTimeIconsList: array expected";
        for (let i = 0; i < message.RealTimeIconsList.length; ++i) {
          let error = $root.douyin.Image.verify(message.RealTimeIconsList[i]);
          if (error) return "RealTimeIconsList." + error;
        }
      }
      return null;
    };

    /**
     * Creates a User message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.User
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.User} User
     */
    User.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.User) return object;
      let message = new $root.douyin.User();
      if (object.id != null)
        if ($util.Long) (message.id = $util.Long.fromValue(object.id)).unsigned = true;
        else if (typeof object.id === "string") message.id = parseInt(object.id, 10);
        else if (typeof object.id === "number") message.id = object.id;
        else if (typeof object.id === "object")
          message.id = new $util.LongBits(object.id.low >>> 0, object.id.high >>> 0).toNumber(true);
      if (object.shortId != null)
        if ($util.Long) (message.shortId = $util.Long.fromValue(object.shortId)).unsigned = true;
        else if (typeof object.shortId === "string") message.shortId = parseInt(object.shortId, 10);
        else if (typeof object.shortId === "number") message.shortId = object.shortId;
        else if (typeof object.shortId === "object")
          message.shortId = new $util.LongBits(
            object.shortId.low >>> 0,
            object.shortId.high >>> 0,
          ).toNumber(true);
      if (object.nickName != null) message.nickName = String(object.nickName);
      if (object.gender != null) message.gender = object.gender >>> 0;
      if (object.Signature != null) message.Signature = String(object.Signature);
      if (object.Level != null) message.Level = object.Level >>> 0;
      if (object.Birthday != null)
        if ($util.Long) (message.Birthday = $util.Long.fromValue(object.Birthday)).unsigned = true;
        else if (typeof object.Birthday === "string")
          message.Birthday = parseInt(object.Birthday, 10);
        else if (typeof object.Birthday === "number") message.Birthday = object.Birthday;
        else if (typeof object.Birthday === "object")
          message.Birthday = new $util.LongBits(
            object.Birthday.low >>> 0,
            object.Birthday.high >>> 0,
          ).toNumber(true);
      if (object.Telephone != null) message.Telephone = String(object.Telephone);
      if (object.AvatarThumb != null) {
        if (typeof object.AvatarThumb !== "object")
          throw TypeError(".douyin.User.AvatarThumb: object expected");
        message.AvatarThumb = $root.douyin.Image.fromObject(object.AvatarThumb);
      }
      if (object.AvatarMedium != null) {
        if (typeof object.AvatarMedium !== "object")
          throw TypeError(".douyin.User.AvatarMedium: object expected");
        message.AvatarMedium = $root.douyin.Image.fromObject(object.AvatarMedium);
      }
      if (object.AvatarLarge != null) {
        if (typeof object.AvatarLarge !== "object")
          throw TypeError(".douyin.User.AvatarLarge: object expected");
        message.AvatarLarge = $root.douyin.Image.fromObject(object.AvatarLarge);
      }
      if (object.Verified != null) message.Verified = Boolean(object.Verified);
      if (object.Experience != null) message.Experience = object.Experience >>> 0;
      if (object.city != null) message.city = String(object.city);
      if (object.Status != null) message.Status = object.Status | 0;
      if (object.CreateTime != null)
        if ($util.Long)
          (message.CreateTime = $util.Long.fromValue(object.CreateTime)).unsigned = true;
        else if (typeof object.CreateTime === "string")
          message.CreateTime = parseInt(object.CreateTime, 10);
        else if (typeof object.CreateTime === "number") message.CreateTime = object.CreateTime;
        else if (typeof object.CreateTime === "object")
          message.CreateTime = new $util.LongBits(
            object.CreateTime.low >>> 0,
            object.CreateTime.high >>> 0,
          ).toNumber(true);
      if (object.ModifyTime != null)
        if ($util.Long)
          (message.ModifyTime = $util.Long.fromValue(object.ModifyTime)).unsigned = true;
        else if (typeof object.ModifyTime === "string")
          message.ModifyTime = parseInt(object.ModifyTime, 10);
        else if (typeof object.ModifyTime === "number") message.ModifyTime = object.ModifyTime;
        else if (typeof object.ModifyTime === "object")
          message.ModifyTime = new $util.LongBits(
            object.ModifyTime.low >>> 0,
            object.ModifyTime.high >>> 0,
          ).toNumber(true);
      if (object.Secret != null) message.Secret = object.Secret >>> 0;
      if (object.ShareQrcodeUri != null) message.ShareQrcodeUri = String(object.ShareQrcodeUri);
      if (object.IncomeSharePercent != null)
        message.IncomeSharePercent = object.IncomeSharePercent >>> 0;
      if (object.BadgeImageList) {
        if (!Array.isArray(object.BadgeImageList))
          throw TypeError(".douyin.User.BadgeImageList: array expected");
        message.BadgeImageList = [];
        for (let i = 0; i < object.BadgeImageList.length; ++i) {
          if (typeof object.BadgeImageList[i] !== "object")
            throw TypeError(".douyin.User.BadgeImageList: object expected");
          message.BadgeImageList[i] = $root.douyin.Image.fromObject(object.BadgeImageList[i]);
        }
      }
      if (object.SpecialId != null) message.SpecialId = String(object.SpecialId);
      if (object.AvatarBorder != null) {
        if (typeof object.AvatarBorder !== "object")
          throw TypeError(".douyin.User.AvatarBorder: object expected");
        message.AvatarBorder = $root.douyin.Image.fromObject(object.AvatarBorder);
      }
      if (object.Medal != null) {
        if (typeof object.Medal !== "object")
          throw TypeError(".douyin.User.Medal: object expected");
        message.Medal = $root.douyin.Image.fromObject(object.Medal);
      }
      if (object.RealTimeIconsList) {
        if (!Array.isArray(object.RealTimeIconsList))
          throw TypeError(".douyin.User.RealTimeIconsList: array expected");
        message.RealTimeIconsList = [];
        for (let i = 0; i < object.RealTimeIconsList.length; ++i) {
          if (typeof object.RealTimeIconsList[i] !== "object")
            throw TypeError(".douyin.User.RealTimeIconsList: object expected");
          message.RealTimeIconsList[i] = $root.douyin.Image.fromObject(object.RealTimeIconsList[i]);
        }
      }
      return message;
    };

    /**
     * Creates a plain object from a User message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.User
     * @static
     * @param {douyin.User} message User
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    User.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) {
        object.BadgeImageList = [];
        object.RealTimeIconsList = [];
      }
      if (options.defaults) {
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.id =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.id = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.shortId =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.shortId = options.longs === String ? "0" : 0;
        object.nickName = "";
        object.gender = 0;
        object.Signature = "";
        object.Level = 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.Birthday =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.Birthday = options.longs === String ? "0" : 0;
        object.Telephone = "";
        object.AvatarThumb = null;
        object.AvatarMedium = null;
        object.AvatarLarge = null;
        object.Verified = false;
        object.Experience = 0;
        object.city = "";
        object.Status = 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.CreateTime =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.CreateTime = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.ModifyTime =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.ModifyTime = options.longs === String ? "0" : 0;
        object.Secret = 0;
        object.ShareQrcodeUri = "";
        object.IncomeSharePercent = 0;
        object.SpecialId = "";
        object.AvatarBorder = null;
        object.Medal = null;
      }
      if (message.id != null && message.hasOwnProperty("id"))
        if (typeof message.id === "number")
          object.id = options.longs === String ? String(message.id) : message.id;
        else
          object.id =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.id)
              : options.longs === Number
                ? new $util.LongBits(message.id.low >>> 0, message.id.high >>> 0).toNumber(true)
                : message.id;
      if (message.shortId != null && message.hasOwnProperty("shortId"))
        if (typeof message.shortId === "number")
          object.shortId = options.longs === String ? String(message.shortId) : message.shortId;
        else
          object.shortId =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.shortId)
              : options.longs === Number
                ? new $util.LongBits(
                    message.shortId.low >>> 0,
                    message.shortId.high >>> 0,
                  ).toNumber(true)
                : message.shortId;
      if (message.nickName != null && message.hasOwnProperty("nickName"))
        object.nickName = message.nickName;
      if (message.gender != null && message.hasOwnProperty("gender"))
        object.gender = message.gender;
      if (message.Signature != null && message.hasOwnProperty("Signature"))
        object.Signature = message.Signature;
      if (message.Level != null && message.hasOwnProperty("Level")) object.Level = message.Level;
      if (message.Birthday != null && message.hasOwnProperty("Birthday"))
        if (typeof message.Birthday === "number")
          object.Birthday = options.longs === String ? String(message.Birthday) : message.Birthday;
        else
          object.Birthday =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.Birthday)
              : options.longs === Number
                ? new $util.LongBits(
                    message.Birthday.low >>> 0,
                    message.Birthday.high >>> 0,
                  ).toNumber(true)
                : message.Birthday;
      if (message.Telephone != null && message.hasOwnProperty("Telephone"))
        object.Telephone = message.Telephone;
      if (message.AvatarThumb != null && message.hasOwnProperty("AvatarThumb"))
        object.AvatarThumb = $root.douyin.Image.toObject(message.AvatarThumb, options);
      if (message.AvatarMedium != null && message.hasOwnProperty("AvatarMedium"))
        object.AvatarMedium = $root.douyin.Image.toObject(message.AvatarMedium, options);
      if (message.AvatarLarge != null && message.hasOwnProperty("AvatarLarge"))
        object.AvatarLarge = $root.douyin.Image.toObject(message.AvatarLarge, options);
      if (message.Verified != null && message.hasOwnProperty("Verified"))
        object.Verified = message.Verified;
      if (message.Experience != null && message.hasOwnProperty("Experience"))
        object.Experience = message.Experience;
      if (message.city != null && message.hasOwnProperty("city")) object.city = message.city;
      if (message.Status != null && message.hasOwnProperty("Status"))
        object.Status = message.Status;
      if (message.CreateTime != null && message.hasOwnProperty("CreateTime"))
        if (typeof message.CreateTime === "number")
          object.CreateTime =
            options.longs === String ? String(message.CreateTime) : message.CreateTime;
        else
          object.CreateTime =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.CreateTime)
              : options.longs === Number
                ? new $util.LongBits(
                    message.CreateTime.low >>> 0,
                    message.CreateTime.high >>> 0,
                  ).toNumber(true)
                : message.CreateTime;
      if (message.ModifyTime != null && message.hasOwnProperty("ModifyTime"))
        if (typeof message.ModifyTime === "number")
          object.ModifyTime =
            options.longs === String ? String(message.ModifyTime) : message.ModifyTime;
        else
          object.ModifyTime =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.ModifyTime)
              : options.longs === Number
                ? new $util.LongBits(
                    message.ModifyTime.low >>> 0,
                    message.ModifyTime.high >>> 0,
                  ).toNumber(true)
                : message.ModifyTime;
      if (message.Secret != null && message.hasOwnProperty("Secret"))
        object.Secret = message.Secret;
      if (message.ShareQrcodeUri != null && message.hasOwnProperty("ShareQrcodeUri"))
        object.ShareQrcodeUri = message.ShareQrcodeUri;
      if (message.IncomeSharePercent != null && message.hasOwnProperty("IncomeSharePercent"))
        object.IncomeSharePercent = message.IncomeSharePercent;
      if (message.BadgeImageList && message.BadgeImageList.length) {
        object.BadgeImageList = [];
        for (let j = 0; j < message.BadgeImageList.length; ++j)
          object.BadgeImageList[j] = $root.douyin.Image.toObject(
            message.BadgeImageList[j],
            options,
          );
      }
      if (message.SpecialId != null && message.hasOwnProperty("SpecialId"))
        object.SpecialId = message.SpecialId;
      if (message.AvatarBorder != null && message.hasOwnProperty("AvatarBorder"))
        object.AvatarBorder = $root.douyin.Image.toObject(message.AvatarBorder, options);
      if (message.Medal != null && message.hasOwnProperty("Medal"))
        object.Medal = $root.douyin.Image.toObject(message.Medal, options);
      if (message.RealTimeIconsList && message.RealTimeIconsList.length) {
        object.RealTimeIconsList = [];
        for (let j = 0; j < message.RealTimeIconsList.length; ++j)
          object.RealTimeIconsList[j] = $root.douyin.Image.toObject(
            message.RealTimeIconsList[j],
            options,
          );
      }
      return object;
    };

    /**
     * Converts this User to JSON.
     * @function toJSON
     * @memberof douyin.User
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    User.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for User
     * @function getTypeUrl
     * @memberof douyin.User
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    User.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.User";
    };

    return User;
  })();

  douyin.Image = (function () {
    /**
     * Properties of an Image.
     * @memberof douyin
     * @interface IImage
     * @property {Array.<string>|null} [urlListList] Image urlListList
     * @property {string|null} [uri] Image uri
     * @property {number|Long|null} [height] Image height
     * @property {number|Long|null} [width] Image width
     * @property {string|null} [avgColor] Image avgColor
     * @property {number|null} [imageType] Image imageType
     * @property {string|null} [openWebUrl] Image openWebUrl
     * @property {douyin.IImageContent|null} [content] Image content
     * @property {boolean|null} [isAnimated] Image isAnimated
     * @property {douyin.INinePatchSetting|null} [FlexSettingList] Image FlexSettingList
     * @property {douyin.INinePatchSetting|null} [TextSettingList] Image TextSettingList
     */

    /**
     * Constructs a new Image.
     * @memberof douyin
     * @classdesc Represents an Image.
     * @implements IImage
     * @constructor
     * @param {douyin.IImage=} [properties] Properties to set
     */
    function Image(properties) {
      this.urlListList = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * Image urlListList.
     * @member {Array.<string>} urlListList
     * @memberof douyin.Image
     * @instance
     */
    Image.prototype.urlListList = $util.emptyArray;

    /**
     * Image uri.
     * @member {string} uri
     * @memberof douyin.Image
     * @instance
     */
    Image.prototype.uri = "";

    /**
     * Image height.
     * @member {number|Long} height
     * @memberof douyin.Image
     * @instance
     */
    Image.prototype.height = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Image width.
     * @member {number|Long} width
     * @memberof douyin.Image
     * @instance
     */
    Image.prototype.width = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * Image avgColor.
     * @member {string} avgColor
     * @memberof douyin.Image
     * @instance
     */
    Image.prototype.avgColor = "";

    /**
     * Image imageType.
     * @member {number} imageType
     * @memberof douyin.Image
     * @instance
     */
    Image.prototype.imageType = 0;

    /**
     * Image openWebUrl.
     * @member {string} openWebUrl
     * @memberof douyin.Image
     * @instance
     */
    Image.prototype.openWebUrl = "";

    /**
     * Image content.
     * @member {douyin.IImageContent|null|undefined} content
     * @memberof douyin.Image
     * @instance
     */
    Image.prototype.content = null;

    /**
     * Image isAnimated.
     * @member {boolean} isAnimated
     * @memberof douyin.Image
     * @instance
     */
    Image.prototype.isAnimated = false;

    /**
     * Image FlexSettingList.
     * @member {douyin.INinePatchSetting|null|undefined} FlexSettingList
     * @memberof douyin.Image
     * @instance
     */
    Image.prototype.FlexSettingList = null;

    /**
     * Image TextSettingList.
     * @member {douyin.INinePatchSetting|null|undefined} TextSettingList
     * @memberof douyin.Image
     * @instance
     */
    Image.prototype.TextSettingList = null;

    /**
     * Creates a new Image instance using the specified properties.
     * @function create
     * @memberof douyin.Image
     * @static
     * @param {douyin.IImage=} [properties] Properties to set
     * @returns {douyin.Image} Image instance
     */
    Image.create = function create(properties) {
      return new Image(properties);
    };

    /**
     * Encodes the specified Image message. Does not implicitly {@link douyin.Image.verify|verify} messages.
     * @function encode
     * @memberof douyin.Image
     * @static
     * @param {douyin.IImage} message Image message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Image.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.urlListList != null && message.urlListList.length)
        for (let i = 0; i < message.urlListList.length; ++i)
          writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.urlListList[i]);
      if (message.uri != null && Object.hasOwnProperty.call(message, "uri"))
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.uri);
      if (message.height != null && Object.hasOwnProperty.call(message, "height"))
        writer.uint32(/* id 3, wireType 0 =*/ 24).uint64(message.height);
      if (message.width != null && Object.hasOwnProperty.call(message, "width"))
        writer.uint32(/* id 4, wireType 0 =*/ 32).uint64(message.width);
      if (message.avgColor != null && Object.hasOwnProperty.call(message, "avgColor"))
        writer.uint32(/* id 5, wireType 2 =*/ 42).string(message.avgColor);
      if (message.imageType != null && Object.hasOwnProperty.call(message, "imageType"))
        writer.uint32(/* id 6, wireType 0 =*/ 48).uint32(message.imageType);
      if (message.openWebUrl != null && Object.hasOwnProperty.call(message, "openWebUrl"))
        writer.uint32(/* id 7, wireType 2 =*/ 58).string(message.openWebUrl);
      if (message.content != null && Object.hasOwnProperty.call(message, "content"))
        $root.douyin.ImageContent.encode(
          message.content,
          writer.uint32(/* id 8, wireType 2 =*/ 66).fork(),
        ).ldelim();
      if (message.isAnimated != null && Object.hasOwnProperty.call(message, "isAnimated"))
        writer.uint32(/* id 9, wireType 0 =*/ 72).bool(message.isAnimated);
      if (message.FlexSettingList != null && Object.hasOwnProperty.call(message, "FlexSettingList"))
        $root.douyin.NinePatchSetting.encode(
          message.FlexSettingList,
          writer.uint32(/* id 10, wireType 2 =*/ 82).fork(),
        ).ldelim();
      if (message.TextSettingList != null && Object.hasOwnProperty.call(message, "TextSettingList"))
        $root.douyin.NinePatchSetting.encode(
          message.TextSettingList,
          writer.uint32(/* id 11, wireType 2 =*/ 90).fork(),
        ).ldelim();
      return writer;
    };

    /**
     * Encodes the specified Image message, length delimited. Does not implicitly {@link douyin.Image.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.Image
     * @static
     * @param {douyin.IImage} message Image message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Image.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes an Image message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.Image
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.Image} Image
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Image.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.Image();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            if (!(message.urlListList && message.urlListList.length)) message.urlListList = [];
            message.urlListList.push(reader.string());
            break;
          }
          case 2: {
            message.uri = reader.string();
            break;
          }
          case 3: {
            message.height = reader.uint64();
            break;
          }
          case 4: {
            message.width = reader.uint64();
            break;
          }
          case 5: {
            message.avgColor = reader.string();
            break;
          }
          case 6: {
            message.imageType = reader.uint32();
            break;
          }
          case 7: {
            message.openWebUrl = reader.string();
            break;
          }
          case 8: {
            message.content = $root.douyin.ImageContent.decode(reader, reader.uint32());
            break;
          }
          case 9: {
            message.isAnimated = reader.bool();
            break;
          }
          case 10: {
            message.FlexSettingList = $root.douyin.NinePatchSetting.decode(reader, reader.uint32());
            break;
          }
          case 11: {
            message.TextSettingList = $root.douyin.NinePatchSetting.decode(reader, reader.uint32());
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes an Image message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.Image
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.Image} Image
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Image.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies an Image message.
     * @function verify
     * @memberof douyin.Image
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Image.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.urlListList != null && message.hasOwnProperty("urlListList")) {
        if (!Array.isArray(message.urlListList)) return "urlListList: array expected";
        for (let i = 0; i < message.urlListList.length; ++i)
          if (!$util.isString(message.urlListList[i])) return "urlListList: string[] expected";
      }
      if (message.uri != null && message.hasOwnProperty("uri"))
        if (!$util.isString(message.uri)) return "uri: string expected";
      if (message.height != null && message.hasOwnProperty("height"))
        if (
          !$util.isInteger(message.height) &&
          !(
            message.height &&
            $util.isInteger(message.height.low) &&
            $util.isInteger(message.height.high)
          )
        )
          return "height: integer|Long expected";
      if (message.width != null && message.hasOwnProperty("width"))
        if (
          !$util.isInteger(message.width) &&
          !(
            message.width &&
            $util.isInteger(message.width.low) &&
            $util.isInteger(message.width.high)
          )
        )
          return "width: integer|Long expected";
      if (message.avgColor != null && message.hasOwnProperty("avgColor"))
        if (!$util.isString(message.avgColor)) return "avgColor: string expected";
      if (message.imageType != null && message.hasOwnProperty("imageType"))
        if (!$util.isInteger(message.imageType)) return "imageType: integer expected";
      if (message.openWebUrl != null && message.hasOwnProperty("openWebUrl"))
        if (!$util.isString(message.openWebUrl)) return "openWebUrl: string expected";
      if (message.content != null && message.hasOwnProperty("content")) {
        let error = $root.douyin.ImageContent.verify(message.content);
        if (error) return "content." + error;
      }
      if (message.isAnimated != null && message.hasOwnProperty("isAnimated"))
        if (typeof message.isAnimated !== "boolean") return "isAnimated: boolean expected";
      if (message.FlexSettingList != null && message.hasOwnProperty("FlexSettingList")) {
        let error = $root.douyin.NinePatchSetting.verify(message.FlexSettingList);
        if (error) return "FlexSettingList." + error;
      }
      if (message.TextSettingList != null && message.hasOwnProperty("TextSettingList")) {
        let error = $root.douyin.NinePatchSetting.verify(message.TextSettingList);
        if (error) return "TextSettingList." + error;
      }
      return null;
    };

    /**
     * Creates an Image message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.Image
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.Image} Image
     */
    Image.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.Image) return object;
      let message = new $root.douyin.Image();
      if (object.urlListList) {
        if (!Array.isArray(object.urlListList))
          throw TypeError(".douyin.Image.urlListList: array expected");
        message.urlListList = [];
        for (let i = 0; i < object.urlListList.length; ++i)
          message.urlListList[i] = String(object.urlListList[i]);
      }
      if (object.uri != null) message.uri = String(object.uri);
      if (object.height != null)
        if ($util.Long) (message.height = $util.Long.fromValue(object.height)).unsigned = true;
        else if (typeof object.height === "string") message.height = parseInt(object.height, 10);
        else if (typeof object.height === "number") message.height = object.height;
        else if (typeof object.height === "object")
          message.height = new $util.LongBits(
            object.height.low >>> 0,
            object.height.high >>> 0,
          ).toNumber(true);
      if (object.width != null)
        if ($util.Long) (message.width = $util.Long.fromValue(object.width)).unsigned = true;
        else if (typeof object.width === "string") message.width = parseInt(object.width, 10);
        else if (typeof object.width === "number") message.width = object.width;
        else if (typeof object.width === "object")
          message.width = new $util.LongBits(
            object.width.low >>> 0,
            object.width.high >>> 0,
          ).toNumber(true);
      if (object.avgColor != null) message.avgColor = String(object.avgColor);
      if (object.imageType != null) message.imageType = object.imageType >>> 0;
      if (object.openWebUrl != null) message.openWebUrl = String(object.openWebUrl);
      if (object.content != null) {
        if (typeof object.content !== "object")
          throw TypeError(".douyin.Image.content: object expected");
        message.content = $root.douyin.ImageContent.fromObject(object.content);
      }
      if (object.isAnimated != null) message.isAnimated = Boolean(object.isAnimated);
      if (object.FlexSettingList != null) {
        if (typeof object.FlexSettingList !== "object")
          throw TypeError(".douyin.Image.FlexSettingList: object expected");
        message.FlexSettingList = $root.douyin.NinePatchSetting.fromObject(object.FlexSettingList);
      }
      if (object.TextSettingList != null) {
        if (typeof object.TextSettingList !== "object")
          throw TypeError(".douyin.Image.TextSettingList: object expected");
        message.TextSettingList = $root.douyin.NinePatchSetting.fromObject(object.TextSettingList);
      }
      return message;
    };

    /**
     * Creates a plain object from an Image message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.Image
     * @static
     * @param {douyin.Image} message Image
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Image.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.urlListList = [];
      if (options.defaults) {
        object.uri = "";
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.height =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.height = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.width =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.width = options.longs === String ? "0" : 0;
        object.avgColor = "";
        object.imageType = 0;
        object.openWebUrl = "";
        object.content = null;
        object.isAnimated = false;
        object.FlexSettingList = null;
        object.TextSettingList = null;
      }
      if (message.urlListList && message.urlListList.length) {
        object.urlListList = [];
        for (let j = 0; j < message.urlListList.length; ++j)
          object.urlListList[j] = message.urlListList[j];
      }
      if (message.uri != null && message.hasOwnProperty("uri")) object.uri = message.uri;
      if (message.height != null && message.hasOwnProperty("height"))
        if (typeof message.height === "number")
          object.height = options.longs === String ? String(message.height) : message.height;
        else
          object.height =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.height)
              : options.longs === Number
                ? new $util.LongBits(message.height.low >>> 0, message.height.high >>> 0).toNumber(
                    true,
                  )
                : message.height;
      if (message.width != null && message.hasOwnProperty("width"))
        if (typeof message.width === "number")
          object.width = options.longs === String ? String(message.width) : message.width;
        else
          object.width =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.width)
              : options.longs === Number
                ? new $util.LongBits(message.width.low >>> 0, message.width.high >>> 0).toNumber(
                    true,
                  )
                : message.width;
      if (message.avgColor != null && message.hasOwnProperty("avgColor"))
        object.avgColor = message.avgColor;
      if (message.imageType != null && message.hasOwnProperty("imageType"))
        object.imageType = message.imageType;
      if (message.openWebUrl != null && message.hasOwnProperty("openWebUrl"))
        object.openWebUrl = message.openWebUrl;
      if (message.content != null && message.hasOwnProperty("content"))
        object.content = $root.douyin.ImageContent.toObject(message.content, options);
      if (message.isAnimated != null && message.hasOwnProperty("isAnimated"))
        object.isAnimated = message.isAnimated;
      if (message.FlexSettingList != null && message.hasOwnProperty("FlexSettingList"))
        object.FlexSettingList = $root.douyin.NinePatchSetting.toObject(
          message.FlexSettingList,
          options,
        );
      if (message.TextSettingList != null && message.hasOwnProperty("TextSettingList"))
        object.TextSettingList = $root.douyin.NinePatchSetting.toObject(
          message.TextSettingList,
          options,
        );
      return object;
    };

    /**
     * Converts this Image to JSON.
     * @function toJSON
     * @memberof douyin.Image
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Image.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Image
     * @function getTypeUrl
     * @memberof douyin.Image
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Image.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.Image";
    };

    return Image;
  })();

  douyin.NinePatchSetting = (function () {
    /**
     * Properties of a NinePatchSetting.
     * @memberof douyin
     * @interface INinePatchSetting
     * @property {Array.<string>|null} [settingListList] NinePatchSetting settingListList
     */

    /**
     * Constructs a new NinePatchSetting.
     * @memberof douyin
     * @classdesc Represents a NinePatchSetting.
     * @implements INinePatchSetting
     * @constructor
     * @param {douyin.INinePatchSetting=} [properties] Properties to set
     */
    function NinePatchSetting(properties) {
      this.settingListList = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * NinePatchSetting settingListList.
     * @member {Array.<string>} settingListList
     * @memberof douyin.NinePatchSetting
     * @instance
     */
    NinePatchSetting.prototype.settingListList = $util.emptyArray;

    /**
     * Creates a new NinePatchSetting instance using the specified properties.
     * @function create
     * @memberof douyin.NinePatchSetting
     * @static
     * @param {douyin.INinePatchSetting=} [properties] Properties to set
     * @returns {douyin.NinePatchSetting} NinePatchSetting instance
     */
    NinePatchSetting.create = function create(properties) {
      return new NinePatchSetting(properties);
    };

    /**
     * Encodes the specified NinePatchSetting message. Does not implicitly {@link douyin.NinePatchSetting.verify|verify} messages.
     * @function encode
     * @memberof douyin.NinePatchSetting
     * @static
     * @param {douyin.INinePatchSetting} message NinePatchSetting message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    NinePatchSetting.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.settingListList != null && message.settingListList.length)
        for (let i = 0; i < message.settingListList.length; ++i)
          writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.settingListList[i]);
      return writer;
    };

    /**
     * Encodes the specified NinePatchSetting message, length delimited. Does not implicitly {@link douyin.NinePatchSetting.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.NinePatchSetting
     * @static
     * @param {douyin.INinePatchSetting} message NinePatchSetting message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    NinePatchSetting.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a NinePatchSetting message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.NinePatchSetting
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.NinePatchSetting} NinePatchSetting
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    NinePatchSetting.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.NinePatchSetting();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            if (!(message.settingListList && message.settingListList.length))
              message.settingListList = [];
            message.settingListList.push(reader.string());
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a NinePatchSetting message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.NinePatchSetting
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.NinePatchSetting} NinePatchSetting
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    NinePatchSetting.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a NinePatchSetting message.
     * @function verify
     * @memberof douyin.NinePatchSetting
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    NinePatchSetting.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.settingListList != null && message.hasOwnProperty("settingListList")) {
        if (!Array.isArray(message.settingListList)) return "settingListList: array expected";
        for (let i = 0; i < message.settingListList.length; ++i)
          if (!$util.isString(message.settingListList[i]))
            return "settingListList: string[] expected";
      }
      return null;
    };

    /**
     * Creates a NinePatchSetting message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.NinePatchSetting
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.NinePatchSetting} NinePatchSetting
     */
    NinePatchSetting.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.NinePatchSetting) return object;
      let message = new $root.douyin.NinePatchSetting();
      if (object.settingListList) {
        if (!Array.isArray(object.settingListList))
          throw TypeError(".douyin.NinePatchSetting.settingListList: array expected");
        message.settingListList = [];
        for (let i = 0; i < object.settingListList.length; ++i)
          message.settingListList[i] = String(object.settingListList[i]);
      }
      return message;
    };

    /**
     * Creates a plain object from a NinePatchSetting message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.NinePatchSetting
     * @static
     * @param {douyin.NinePatchSetting} message NinePatchSetting
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    NinePatchSetting.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.settingListList = [];
      if (message.settingListList && message.settingListList.length) {
        object.settingListList = [];
        for (let j = 0; j < message.settingListList.length; ++j)
          object.settingListList[j] = message.settingListList[j];
      }
      return object;
    };

    /**
     * Converts this NinePatchSetting to JSON.
     * @function toJSON
     * @memberof douyin.NinePatchSetting
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    NinePatchSetting.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for NinePatchSetting
     * @function getTypeUrl
     * @memberof douyin.NinePatchSetting
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    NinePatchSetting.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.NinePatchSetting";
    };

    return NinePatchSetting;
  })();

  douyin.ImageContent = (function () {
    /**
     * Properties of an ImageContent.
     * @memberof douyin
     * @interface IImageContent
     * @property {string|null} [name] ImageContent name
     * @property {string|null} [fontColor] ImageContent fontColor
     * @property {number|Long|null} [level] ImageContent level
     * @property {string|null} [alternativeText] ImageContent alternativeText
     */

    /**
     * Constructs a new ImageContent.
     * @memberof douyin
     * @classdesc Represents an ImageContent.
     * @implements IImageContent
     * @constructor
     * @param {douyin.IImageContent=} [properties] Properties to set
     */
    function ImageContent(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * ImageContent name.
     * @member {string} name
     * @memberof douyin.ImageContent
     * @instance
     */
    ImageContent.prototype.name = "";

    /**
     * ImageContent fontColor.
     * @member {string} fontColor
     * @memberof douyin.ImageContent
     * @instance
     */
    ImageContent.prototype.fontColor = "";

    /**
     * ImageContent level.
     * @member {number|Long} level
     * @memberof douyin.ImageContent
     * @instance
     */
    ImageContent.prototype.level = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * ImageContent alternativeText.
     * @member {string} alternativeText
     * @memberof douyin.ImageContent
     * @instance
     */
    ImageContent.prototype.alternativeText = "";

    /**
     * Creates a new ImageContent instance using the specified properties.
     * @function create
     * @memberof douyin.ImageContent
     * @static
     * @param {douyin.IImageContent=} [properties] Properties to set
     * @returns {douyin.ImageContent} ImageContent instance
     */
    ImageContent.create = function create(properties) {
      return new ImageContent(properties);
    };

    /**
     * Encodes the specified ImageContent message. Does not implicitly {@link douyin.ImageContent.verify|verify} messages.
     * @function encode
     * @memberof douyin.ImageContent
     * @static
     * @param {douyin.IImageContent} message ImageContent message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ImageContent.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.name != null && Object.hasOwnProperty.call(message, "name"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.name);
      if (message.fontColor != null && Object.hasOwnProperty.call(message, "fontColor"))
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.fontColor);
      if (message.level != null && Object.hasOwnProperty.call(message, "level"))
        writer.uint32(/* id 3, wireType 0 =*/ 24).uint64(message.level);
      if (message.alternativeText != null && Object.hasOwnProperty.call(message, "alternativeText"))
        writer.uint32(/* id 4, wireType 2 =*/ 34).string(message.alternativeText);
      return writer;
    };

    /**
     * Encodes the specified ImageContent message, length delimited. Does not implicitly {@link douyin.ImageContent.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.ImageContent
     * @static
     * @param {douyin.IImageContent} message ImageContent message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ImageContent.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes an ImageContent message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.ImageContent
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.ImageContent} ImageContent
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ImageContent.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.ImageContent();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.name = reader.string();
            break;
          }
          case 2: {
            message.fontColor = reader.string();
            break;
          }
          case 3: {
            message.level = reader.uint64();
            break;
          }
          case 4: {
            message.alternativeText = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes an ImageContent message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.ImageContent
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.ImageContent} ImageContent
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ImageContent.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies an ImageContent message.
     * @function verify
     * @memberof douyin.ImageContent
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ImageContent.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.name != null && message.hasOwnProperty("name"))
        if (!$util.isString(message.name)) return "name: string expected";
      if (message.fontColor != null && message.hasOwnProperty("fontColor"))
        if (!$util.isString(message.fontColor)) return "fontColor: string expected";
      if (message.level != null && message.hasOwnProperty("level"))
        if (
          !$util.isInteger(message.level) &&
          !(
            message.level &&
            $util.isInteger(message.level.low) &&
            $util.isInteger(message.level.high)
          )
        )
          return "level: integer|Long expected";
      if (message.alternativeText != null && message.hasOwnProperty("alternativeText"))
        if (!$util.isString(message.alternativeText)) return "alternativeText: string expected";
      return null;
    };

    /**
     * Creates an ImageContent message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.ImageContent
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.ImageContent} ImageContent
     */
    ImageContent.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.ImageContent) return object;
      let message = new $root.douyin.ImageContent();
      if (object.name != null) message.name = String(object.name);
      if (object.fontColor != null) message.fontColor = String(object.fontColor);
      if (object.level != null)
        if ($util.Long) (message.level = $util.Long.fromValue(object.level)).unsigned = true;
        else if (typeof object.level === "string") message.level = parseInt(object.level, 10);
        else if (typeof object.level === "number") message.level = object.level;
        else if (typeof object.level === "object")
          message.level = new $util.LongBits(
            object.level.low >>> 0,
            object.level.high >>> 0,
          ).toNumber(true);
      if (object.alternativeText != null) message.alternativeText = String(object.alternativeText);
      return message;
    };

    /**
     * Creates a plain object from an ImageContent message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.ImageContent
     * @static
     * @param {douyin.ImageContent} message ImageContent
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ImageContent.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.name = "";
        object.fontColor = "";
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.level =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.level = options.longs === String ? "0" : 0;
        object.alternativeText = "";
      }
      if (message.name != null && message.hasOwnProperty("name")) object.name = message.name;
      if (message.fontColor != null && message.hasOwnProperty("fontColor"))
        object.fontColor = message.fontColor;
      if (message.level != null && message.hasOwnProperty("level"))
        if (typeof message.level === "number")
          object.level = options.longs === String ? String(message.level) : message.level;
        else
          object.level =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.level)
              : options.longs === Number
                ? new $util.LongBits(message.level.low >>> 0, message.level.high >>> 0).toNumber(
                    true,
                  )
                : message.level;
      if (message.alternativeText != null && message.hasOwnProperty("alternativeText"))
        object.alternativeText = message.alternativeText;
      return object;
    };

    /**
     * Converts this ImageContent to JSON.
     * @function toJSON
     * @memberof douyin.ImageContent
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ImageContent.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for ImageContent
     * @function getTypeUrl
     * @memberof douyin.ImageContent
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    ImageContent.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.ImageContent";
    };

    return ImageContent;
  })();

  douyin.PushFrame = (function () {
    /**
     * Properties of a PushFrame.
     * @memberof douyin
     * @interface IPushFrame
     * @property {number|Long|null} [seqId] PushFrame seqId
     * @property {number|Long|null} [logId] PushFrame logId
     * @property {number|Long|null} [service] PushFrame service
     * @property {number|Long|null} [method] PushFrame method
     * @property {Array.<douyin.IHeadersList>|null} [headersList] PushFrame headersList
     * @property {string|null} [payloadEncoding] PushFrame payloadEncoding
     * @property {string|null} [payloadType] PushFrame payloadType
     * @property {Uint8Array|null} [payload] PushFrame payload
     */

    /**
     * Constructs a new PushFrame.
     * @memberof douyin
     * @classdesc Represents a PushFrame.
     * @implements IPushFrame
     * @constructor
     * @param {douyin.IPushFrame=} [properties] Properties to set
     */
    function PushFrame(properties) {
      this.headersList = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * PushFrame seqId.
     * @member {number|Long} seqId
     * @memberof douyin.PushFrame
     * @instance
     */
    PushFrame.prototype.seqId = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * PushFrame logId.
     * @member {number|Long} logId
     * @memberof douyin.PushFrame
     * @instance
     */
    PushFrame.prototype.logId = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * PushFrame service.
     * @member {number|Long} service
     * @memberof douyin.PushFrame
     * @instance
     */
    PushFrame.prototype.service = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * PushFrame method.
     * @member {number|Long} method
     * @memberof douyin.PushFrame
     * @instance
     */
    PushFrame.prototype.method = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;

    /**
     * PushFrame headersList.
     * @member {Array.<douyin.IHeadersList>} headersList
     * @memberof douyin.PushFrame
     * @instance
     */
    PushFrame.prototype.headersList = $util.emptyArray;

    /**
     * PushFrame payloadEncoding.
     * @member {string} payloadEncoding
     * @memberof douyin.PushFrame
     * @instance
     */
    PushFrame.prototype.payloadEncoding = "";

    /**
     * PushFrame payloadType.
     * @member {string} payloadType
     * @memberof douyin.PushFrame
     * @instance
     */
    PushFrame.prototype.payloadType = "";

    /**
     * PushFrame payload.
     * @member {Uint8Array} payload
     * @memberof douyin.PushFrame
     * @instance
     */
    PushFrame.prototype.payload = $util.newBuffer([]);

    /**
     * Creates a new PushFrame instance using the specified properties.
     * @function create
     * @memberof douyin.PushFrame
     * @static
     * @param {douyin.IPushFrame=} [properties] Properties to set
     * @returns {douyin.PushFrame} PushFrame instance
     */
    PushFrame.create = function create(properties) {
      return new PushFrame(properties);
    };

    /**
     * Encodes the specified PushFrame message. Does not implicitly {@link douyin.PushFrame.verify|verify} messages.
     * @function encode
     * @memberof douyin.PushFrame
     * @static
     * @param {douyin.IPushFrame} message PushFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PushFrame.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.seqId != null && Object.hasOwnProperty.call(message, "seqId"))
        writer.uint32(/* id 1, wireType 0 =*/ 8).uint64(message.seqId);
      if (message.logId != null && Object.hasOwnProperty.call(message, "logId"))
        writer.uint32(/* id 2, wireType 0 =*/ 16).uint64(message.logId);
      if (message.service != null && Object.hasOwnProperty.call(message, "service"))
        writer.uint32(/* id 3, wireType 0 =*/ 24).uint64(message.service);
      if (message.method != null && Object.hasOwnProperty.call(message, "method"))
        writer.uint32(/* id 4, wireType 0 =*/ 32).uint64(message.method);
      if (message.headersList != null && message.headersList.length)
        for (let i = 0; i < message.headersList.length; ++i)
          $root.douyin.HeadersList.encode(
            message.headersList[i],
            writer.uint32(/* id 5, wireType 2 =*/ 42).fork(),
          ).ldelim();
      if (message.payloadEncoding != null && Object.hasOwnProperty.call(message, "payloadEncoding"))
        writer.uint32(/* id 6, wireType 2 =*/ 50).string(message.payloadEncoding);
      if (message.payloadType != null && Object.hasOwnProperty.call(message, "payloadType"))
        writer.uint32(/* id 7, wireType 2 =*/ 58).string(message.payloadType);
      if (message.payload != null && Object.hasOwnProperty.call(message, "payload"))
        writer.uint32(/* id 8, wireType 2 =*/ 66).bytes(message.payload);
      return writer;
    };

    /**
     * Encodes the specified PushFrame message, length delimited. Does not implicitly {@link douyin.PushFrame.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.PushFrame
     * @static
     * @param {douyin.IPushFrame} message PushFrame message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PushFrame.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a PushFrame message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.PushFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.PushFrame} PushFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PushFrame.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.PushFrame();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.seqId = reader.uint64();
            break;
          }
          case 2: {
            message.logId = reader.uint64();
            break;
          }
          case 3: {
            message.service = reader.uint64();
            break;
          }
          case 4: {
            message.method = reader.uint64();
            break;
          }
          case 5: {
            if (!(message.headersList && message.headersList.length)) message.headersList = [];
            message.headersList.push($root.douyin.HeadersList.decode(reader, reader.uint32()));
            break;
          }
          case 6: {
            message.payloadEncoding = reader.string();
            break;
          }
          case 7: {
            message.payloadType = reader.string();
            break;
          }
          case 8: {
            message.payload = reader.bytes();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a PushFrame message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.PushFrame
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.PushFrame} PushFrame
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PushFrame.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a PushFrame message.
     * @function verify
     * @memberof douyin.PushFrame
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    PushFrame.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.seqId != null && message.hasOwnProperty("seqId"))
        if (
          !$util.isInteger(message.seqId) &&
          !(
            message.seqId &&
            $util.isInteger(message.seqId.low) &&
            $util.isInteger(message.seqId.high)
          )
        )
          return "seqId: integer|Long expected";
      if (message.logId != null && message.hasOwnProperty("logId"))
        if (
          !$util.isInteger(message.logId) &&
          !(
            message.logId &&
            $util.isInteger(message.logId.low) &&
            $util.isInteger(message.logId.high)
          )
        )
          return "logId: integer|Long expected";
      if (message.service != null && message.hasOwnProperty("service"))
        if (
          !$util.isInteger(message.service) &&
          !(
            message.service &&
            $util.isInteger(message.service.low) &&
            $util.isInteger(message.service.high)
          )
        )
          return "service: integer|Long expected";
      if (message.method != null && message.hasOwnProperty("method"))
        if (
          !$util.isInteger(message.method) &&
          !(
            message.method &&
            $util.isInteger(message.method.low) &&
            $util.isInteger(message.method.high)
          )
        )
          return "method: integer|Long expected";
      if (message.headersList != null && message.hasOwnProperty("headersList")) {
        if (!Array.isArray(message.headersList)) return "headersList: array expected";
        for (let i = 0; i < message.headersList.length; ++i) {
          let error = $root.douyin.HeadersList.verify(message.headersList[i]);
          if (error) return "headersList." + error;
        }
      }
      if (message.payloadEncoding != null && message.hasOwnProperty("payloadEncoding"))
        if (!$util.isString(message.payloadEncoding)) return "payloadEncoding: string expected";
      if (message.payloadType != null && message.hasOwnProperty("payloadType"))
        if (!$util.isString(message.payloadType)) return "payloadType: string expected";
      if (message.payload != null && message.hasOwnProperty("payload"))
        if (
          !(
            (message.payload && typeof message.payload.length === "number") ||
            $util.isString(message.payload)
          )
        )
          return "payload: buffer expected";
      return null;
    };

    /**
     * Creates a PushFrame message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.PushFrame
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.PushFrame} PushFrame
     */
    PushFrame.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.PushFrame) return object;
      let message = new $root.douyin.PushFrame();
      if (object.seqId != null)
        if ($util.Long) (message.seqId = $util.Long.fromValue(object.seqId)).unsigned = true;
        else if (typeof object.seqId === "string") message.seqId = parseInt(object.seqId, 10);
        else if (typeof object.seqId === "number") message.seqId = object.seqId;
        else if (typeof object.seqId === "object")
          message.seqId = new $util.LongBits(
            object.seqId.low >>> 0,
            object.seqId.high >>> 0,
          ).toNumber(true);
      if (object.logId != null)
        if ($util.Long) (message.logId = $util.Long.fromValue(object.logId)).unsigned = true;
        else if (typeof object.logId === "string") message.logId = parseInt(object.logId, 10);
        else if (typeof object.logId === "number") message.logId = object.logId;
        else if (typeof object.logId === "object")
          message.logId = new $util.LongBits(
            object.logId.low >>> 0,
            object.logId.high >>> 0,
          ).toNumber(true);
      if (object.service != null)
        if ($util.Long) (message.service = $util.Long.fromValue(object.service)).unsigned = true;
        else if (typeof object.service === "string") message.service = parseInt(object.service, 10);
        else if (typeof object.service === "number") message.service = object.service;
        else if (typeof object.service === "object")
          message.service = new $util.LongBits(
            object.service.low >>> 0,
            object.service.high >>> 0,
          ).toNumber(true);
      if (object.method != null)
        if ($util.Long) (message.method = $util.Long.fromValue(object.method)).unsigned = true;
        else if (typeof object.method === "string") message.method = parseInt(object.method, 10);
        else if (typeof object.method === "number") message.method = object.method;
        else if (typeof object.method === "object")
          message.method = new $util.LongBits(
            object.method.low >>> 0,
            object.method.high >>> 0,
          ).toNumber(true);
      if (object.headersList) {
        if (!Array.isArray(object.headersList))
          throw TypeError(".douyin.PushFrame.headersList: array expected");
        message.headersList = [];
        for (let i = 0; i < object.headersList.length; ++i) {
          if (typeof object.headersList[i] !== "object")
            throw TypeError(".douyin.PushFrame.headersList: object expected");
          message.headersList[i] = $root.douyin.HeadersList.fromObject(object.headersList[i]);
        }
      }
      if (object.payloadEncoding != null) message.payloadEncoding = String(object.payloadEncoding);
      if (object.payloadType != null) message.payloadType = String(object.payloadType);
      if (object.payload != null)
        if (typeof object.payload === "string")
          $util.base64.decode(
            object.payload,
            (message.payload = $util.newBuffer($util.base64.length(object.payload))),
            0,
          );
        else if (object.payload.length >= 0) message.payload = object.payload;
      return message;
    };

    /**
     * Creates a plain object from a PushFrame message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.PushFrame
     * @static
     * @param {douyin.PushFrame} message PushFrame
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    PushFrame.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.headersList = [];
      if (options.defaults) {
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.seqId =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.seqId = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.logId =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.logId = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.service =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.service = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, true);
          object.method =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.method = options.longs === String ? "0" : 0;
        object.payloadEncoding = "";
        object.payloadType = "";
        if (options.bytes === String) object.payload = "";
        else {
          object.payload = [];
          if (options.bytes !== Array) object.payload = $util.newBuffer(object.payload);
        }
      }
      if (message.seqId != null && message.hasOwnProperty("seqId"))
        if (typeof message.seqId === "number")
          object.seqId = options.longs === String ? String(message.seqId) : message.seqId;
        else
          object.seqId =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.seqId)
              : options.longs === Number
                ? new $util.LongBits(message.seqId.low >>> 0, message.seqId.high >>> 0).toNumber(
                    true,
                  )
                : message.seqId;
      if (message.logId != null && message.hasOwnProperty("logId"))
        if (typeof message.logId === "number")
          object.logId = options.longs === String ? String(message.logId) : message.logId;
        else
          object.logId =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.logId)
              : options.longs === Number
                ? new $util.LongBits(message.logId.low >>> 0, message.logId.high >>> 0).toNumber(
                    true,
                  )
                : message.logId;
      if (message.service != null && message.hasOwnProperty("service"))
        if (typeof message.service === "number")
          object.service = options.longs === String ? String(message.service) : message.service;
        else
          object.service =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.service)
              : options.longs === Number
                ? new $util.LongBits(
                    message.service.low >>> 0,
                    message.service.high >>> 0,
                  ).toNumber(true)
                : message.service;
      if (message.method != null && message.hasOwnProperty("method"))
        if (typeof message.method === "number")
          object.method = options.longs === String ? String(message.method) : message.method;
        else
          object.method =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.method)
              : options.longs === Number
                ? new $util.LongBits(message.method.low >>> 0, message.method.high >>> 0).toNumber(
                    true,
                  )
                : message.method;
      if (message.headersList && message.headersList.length) {
        object.headersList = [];
        for (let j = 0; j < message.headersList.length; ++j)
          object.headersList[j] = $root.douyin.HeadersList.toObject(
            message.headersList[j],
            options,
          );
      }
      if (message.payloadEncoding != null && message.hasOwnProperty("payloadEncoding"))
        object.payloadEncoding = message.payloadEncoding;
      if (message.payloadType != null && message.hasOwnProperty("payloadType"))
        object.payloadType = message.payloadType;
      if (message.payload != null && message.hasOwnProperty("payload"))
        object.payload =
          options.bytes === String
            ? $util.base64.encode(message.payload, 0, message.payload.length)
            : options.bytes === Array
              ? Array.prototype.slice.call(message.payload)
              : message.payload;
      return object;
    };

    /**
     * Converts this PushFrame to JSON.
     * @function toJSON
     * @memberof douyin.PushFrame
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    PushFrame.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for PushFrame
     * @function getTypeUrl
     * @memberof douyin.PushFrame
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    PushFrame.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.PushFrame";
    };

    return PushFrame;
  })();

  douyin.HeadersList = (function () {
    /**
     * Properties of a HeadersList.
     * @memberof douyin
     * @interface IHeadersList
     * @property {string|null} [key] HeadersList key
     * @property {string|null} [value] HeadersList value
     */

    /**
     * Constructs a new HeadersList.
     * @memberof douyin
     * @classdesc Represents a HeadersList.
     * @implements IHeadersList
     * @constructor
     * @param {douyin.IHeadersList=} [properties] Properties to set
     */
    function HeadersList(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * HeadersList key.
     * @member {string} key
     * @memberof douyin.HeadersList
     * @instance
     */
    HeadersList.prototype.key = "";

    /**
     * HeadersList value.
     * @member {string} value
     * @memberof douyin.HeadersList
     * @instance
     */
    HeadersList.prototype.value = "";

    /**
     * Creates a new HeadersList instance using the specified properties.
     * @function create
     * @memberof douyin.HeadersList
     * @static
     * @param {douyin.IHeadersList=} [properties] Properties to set
     * @returns {douyin.HeadersList} HeadersList instance
     */
    HeadersList.create = function create(properties) {
      return new HeadersList(properties);
    };

    /**
     * Encodes the specified HeadersList message. Does not implicitly {@link douyin.HeadersList.verify|verify} messages.
     * @function encode
     * @memberof douyin.HeadersList
     * @static
     * @param {douyin.IHeadersList} message HeadersList message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    HeadersList.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.key != null && Object.hasOwnProperty.call(message, "key"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.key);
      if (message.value != null && Object.hasOwnProperty.call(message, "value"))
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.value);
      return writer;
    };

    /**
     * Encodes the specified HeadersList message, length delimited. Does not implicitly {@link douyin.HeadersList.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.HeadersList
     * @static
     * @param {douyin.IHeadersList} message HeadersList message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    HeadersList.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a HeadersList message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.HeadersList
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.HeadersList} HeadersList
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    HeadersList.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.HeadersList();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.key = reader.string();
            break;
          }
          case 2: {
            message.value = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a HeadersList message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.HeadersList
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.HeadersList} HeadersList
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    HeadersList.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a HeadersList message.
     * @function verify
     * @memberof douyin.HeadersList
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    HeadersList.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.key != null && message.hasOwnProperty("key"))
        if (!$util.isString(message.key)) return "key: string expected";
      if (message.value != null && message.hasOwnProperty("value"))
        if (!$util.isString(message.value)) return "value: string expected";
      return null;
    };

    /**
     * Creates a HeadersList message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.HeadersList
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.HeadersList} HeadersList
     */
    HeadersList.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.HeadersList) return object;
      let message = new $root.douyin.HeadersList();
      if (object.key != null) message.key = String(object.key);
      if (object.value != null) message.value = String(object.value);
      return message;
    };

    /**
     * Creates a plain object from a HeadersList message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.HeadersList
     * @static
     * @param {douyin.HeadersList} message HeadersList
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    HeadersList.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.key = "";
        object.value = "";
      }
      if (message.key != null && message.hasOwnProperty("key")) object.key = message.key;
      if (message.value != null && message.hasOwnProperty("value")) object.value = message.value;
      return object;
    };

    /**
     * Converts this HeadersList to JSON.
     * @function toJSON
     * @memberof douyin.HeadersList
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    HeadersList.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for HeadersList
     * @function getTypeUrl
     * @memberof douyin.HeadersList
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    HeadersList.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.HeadersList";
    };

    return HeadersList;
  })();

  /**
   * CommentTypeTag enum.
   * @name douyin.CommentTypeTag
   * @enum {number}
   * @property {number} COMMENTTYPETAGUNKNOWN=0 COMMENTTYPETAGUNKNOWN value
   * @property {number} COMMENTTYPETAGSTAR=1 COMMENTTYPETAGSTAR value
   */
  douyin.CommentTypeTag = (function () {
    const valuesById = {},
      values = Object.create(valuesById);
    values[(valuesById[0] = "COMMENTTYPETAGUNKNOWN")] = 0;
    values[(valuesById[1] = "COMMENTTYPETAGSTAR")] = 1;
    return values;
  })();

  douyin.LiveShoppingMessage = (function () {
    /**
     * Properties of a LiveShoppingMessage.
     * @memberof douyin
     * @interface ILiveShoppingMessage
     * @property {douyin.ICommon|null} [common] LiveShoppingMessage common
     * @property {number|null} [msgType] LiveShoppingMessage msgType
     * @property {number|Long|null} [promotionId] LiveShoppingMessage promotionId
     */

    /**
     * Constructs a new LiveShoppingMessage.
     * @memberof douyin
     * @classdesc Represents a LiveShoppingMessage.
     * @implements ILiveShoppingMessage
     * @constructor
     * @param {douyin.ILiveShoppingMessage=} [properties] Properties to set
     */
    function LiveShoppingMessage(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * LiveShoppingMessage common.
     * @member {douyin.ICommon|null|undefined} common
     * @memberof douyin.LiveShoppingMessage
     * @instance
     */
    LiveShoppingMessage.prototype.common = null;

    /**
     * LiveShoppingMessage msgType.
     * @member {number} msgType
     * @memberof douyin.LiveShoppingMessage
     * @instance
     */
    LiveShoppingMessage.prototype.msgType = 0;

    /**
     * LiveShoppingMessage promotionId.
     * @member {number|Long} promotionId
     * @memberof douyin.LiveShoppingMessage
     * @instance
     */
    LiveShoppingMessage.prototype.promotionId = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;

    /**
     * Creates a new LiveShoppingMessage instance using the specified properties.
     * @function create
     * @memberof douyin.LiveShoppingMessage
     * @static
     * @param {douyin.ILiveShoppingMessage=} [properties] Properties to set
     * @returns {douyin.LiveShoppingMessage} LiveShoppingMessage instance
     */
    LiveShoppingMessage.create = function create(properties) {
      return new LiveShoppingMessage(properties);
    };

    /**
     * Encodes the specified LiveShoppingMessage message. Does not implicitly {@link douyin.LiveShoppingMessage.verify|verify} messages.
     * @function encode
     * @memberof douyin.LiveShoppingMessage
     * @static
     * @param {douyin.ILiveShoppingMessage} message LiveShoppingMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    LiveShoppingMessage.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.common != null && Object.hasOwnProperty.call(message, "common"))
        $root.douyin.Common.encode(
          message.common,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (message.msgType != null && Object.hasOwnProperty.call(message, "msgType"))
        writer.uint32(/* id 2, wireType 0 =*/ 16).int32(message.msgType);
      if (message.promotionId != null && Object.hasOwnProperty.call(message, "promotionId"))
        writer.uint32(/* id 4, wireType 0 =*/ 32).int64(message.promotionId);
      return writer;
    };

    /**
     * Encodes the specified LiveShoppingMessage message, length delimited. Does not implicitly {@link douyin.LiveShoppingMessage.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.LiveShoppingMessage
     * @static
     * @param {douyin.ILiveShoppingMessage} message LiveShoppingMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    LiveShoppingMessage.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a LiveShoppingMessage message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.LiveShoppingMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.LiveShoppingMessage} LiveShoppingMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    LiveShoppingMessage.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.LiveShoppingMessage();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.common = $root.douyin.Common.decode(reader, reader.uint32());
            break;
          }
          case 2: {
            message.msgType = reader.int32();
            break;
          }
          case 4: {
            message.promotionId = reader.int64();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a LiveShoppingMessage message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.LiveShoppingMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.LiveShoppingMessage} LiveShoppingMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    LiveShoppingMessage.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a LiveShoppingMessage message.
     * @function verify
     * @memberof douyin.LiveShoppingMessage
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    LiveShoppingMessage.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.common != null && message.hasOwnProperty("common")) {
        let error = $root.douyin.Common.verify(message.common);
        if (error) return "common." + error;
      }
      if (message.msgType != null && message.hasOwnProperty("msgType"))
        if (!$util.isInteger(message.msgType)) return "msgType: integer expected";
      if (message.promotionId != null && message.hasOwnProperty("promotionId"))
        if (
          !$util.isInteger(message.promotionId) &&
          !(
            message.promotionId &&
            $util.isInteger(message.promotionId.low) &&
            $util.isInteger(message.promotionId.high)
          )
        )
          return "promotionId: integer|Long expected";
      return null;
    };

    /**
     * Creates a LiveShoppingMessage message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.LiveShoppingMessage
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.LiveShoppingMessage} LiveShoppingMessage
     */
    LiveShoppingMessage.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.LiveShoppingMessage) return object;
      let message = new $root.douyin.LiveShoppingMessage();
      if (object.common != null) {
        if (typeof object.common !== "object")
          throw TypeError(".douyin.LiveShoppingMessage.common: object expected");
        message.common = $root.douyin.Common.fromObject(object.common);
      }
      if (object.msgType != null) message.msgType = object.msgType | 0;
      if (object.promotionId != null)
        if ($util.Long)
          (message.promotionId = $util.Long.fromValue(object.promotionId)).unsigned = false;
        else if (typeof object.promotionId === "string")
          message.promotionId = parseInt(object.promotionId, 10);
        else if (typeof object.promotionId === "number") message.promotionId = object.promotionId;
        else if (typeof object.promotionId === "object")
          message.promotionId = new $util.LongBits(
            object.promotionId.low >>> 0,
            object.promotionId.high >>> 0,
          ).toNumber();
      return message;
    };

    /**
     * Creates a plain object from a LiveShoppingMessage message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.LiveShoppingMessage
     * @static
     * @param {douyin.LiveShoppingMessage} message LiveShoppingMessage
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    LiveShoppingMessage.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.common = null;
        object.msgType = 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, false);
          object.promotionId =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.promotionId = options.longs === String ? "0" : 0;
      }
      if (message.common != null && message.hasOwnProperty("common"))
        object.common = $root.douyin.Common.toObject(message.common, options);
      if (message.msgType != null && message.hasOwnProperty("msgType"))
        object.msgType = message.msgType;
      if (message.promotionId != null && message.hasOwnProperty("promotionId"))
        if (typeof message.promotionId === "number")
          object.promotionId =
            options.longs === String ? String(message.promotionId) : message.promotionId;
        else
          object.promotionId =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.promotionId)
              : options.longs === Number
                ? new $util.LongBits(
                    message.promotionId.low >>> 0,
                    message.promotionId.high >>> 0,
                  ).toNumber()
                : message.promotionId;
      return object;
    };

    /**
     * Converts this LiveShoppingMessage to JSON.
     * @function toJSON
     * @memberof douyin.LiveShoppingMessage
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    LiveShoppingMessage.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for LiveShoppingMessage
     * @function getTypeUrl
     * @memberof douyin.LiveShoppingMessage
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    LiveShoppingMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.LiveShoppingMessage";
    };

    return LiveShoppingMessage;
  })();

  douyin.RoomStatsMessage = (function () {
    /**
     * Properties of a RoomStatsMessage.
     * @memberof douyin
     * @interface IRoomStatsMessage
     * @property {douyin.ICommon|null} [common] RoomStatsMessage common
     * @property {string|null} [displayShort] RoomStatsMessage displayShort
     * @property {string|null} [displayMiddle] RoomStatsMessage displayMiddle
     * @property {string|null} [displayLong] RoomStatsMessage displayLong
     * @property {number|Long|null} [displayValue] RoomStatsMessage displayValue
     * @property {number|Long|null} [displayVersion] RoomStatsMessage displayVersion
     * @property {boolean|null} [incremental] RoomStatsMessage incremental
     * @property {boolean|null} [isHidden] RoomStatsMessage isHidden
     * @property {number|Long|null} [total] RoomStatsMessage total
     * @property {number|Long|null} [displayType] RoomStatsMessage displayType
     */

    /**
     * Constructs a new RoomStatsMessage.
     * @memberof douyin
     * @classdesc Represents a RoomStatsMessage.
     * @implements IRoomStatsMessage
     * @constructor
     * @param {douyin.IRoomStatsMessage=} [properties] Properties to set
     */
    function RoomStatsMessage(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * RoomStatsMessage common.
     * @member {douyin.ICommon|null|undefined} common
     * @memberof douyin.RoomStatsMessage
     * @instance
     */
    RoomStatsMessage.prototype.common = null;

    /**
     * RoomStatsMessage displayShort.
     * @member {string} displayShort
     * @memberof douyin.RoomStatsMessage
     * @instance
     */
    RoomStatsMessage.prototype.displayShort = "";

    /**
     * RoomStatsMessage displayMiddle.
     * @member {string} displayMiddle
     * @memberof douyin.RoomStatsMessage
     * @instance
     */
    RoomStatsMessage.prototype.displayMiddle = "";

    /**
     * RoomStatsMessage displayLong.
     * @member {string} displayLong
     * @memberof douyin.RoomStatsMessage
     * @instance
     */
    RoomStatsMessage.prototype.displayLong = "";

    /**
     * RoomStatsMessage displayValue.
     * @member {number|Long} displayValue
     * @memberof douyin.RoomStatsMessage
     * @instance
     */
    RoomStatsMessage.prototype.displayValue = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;

    /**
     * RoomStatsMessage displayVersion.
     * @member {number|Long} displayVersion
     * @memberof douyin.RoomStatsMessage
     * @instance
     */
    RoomStatsMessage.prototype.displayVersion = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;

    /**
     * RoomStatsMessage incremental.
     * @member {boolean} incremental
     * @memberof douyin.RoomStatsMessage
     * @instance
     */
    RoomStatsMessage.prototype.incremental = false;

    /**
     * RoomStatsMessage isHidden.
     * @member {boolean} isHidden
     * @memberof douyin.RoomStatsMessage
     * @instance
     */
    RoomStatsMessage.prototype.isHidden = false;

    /**
     * RoomStatsMessage total.
     * @member {number|Long} total
     * @memberof douyin.RoomStatsMessage
     * @instance
     */
    RoomStatsMessage.prototype.total = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;

    /**
     * RoomStatsMessage displayType.
     * @member {number|Long} displayType
     * @memberof douyin.RoomStatsMessage
     * @instance
     */
    RoomStatsMessage.prototype.displayType = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;

    /**
     * Creates a new RoomStatsMessage instance using the specified properties.
     * @function create
     * @memberof douyin.RoomStatsMessage
     * @static
     * @param {douyin.IRoomStatsMessage=} [properties] Properties to set
     * @returns {douyin.RoomStatsMessage} RoomStatsMessage instance
     */
    RoomStatsMessage.create = function create(properties) {
      return new RoomStatsMessage(properties);
    };

    /**
     * Encodes the specified RoomStatsMessage message. Does not implicitly {@link douyin.RoomStatsMessage.verify|verify} messages.
     * @function encode
     * @memberof douyin.RoomStatsMessage
     * @static
     * @param {douyin.IRoomStatsMessage} message RoomStatsMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    RoomStatsMessage.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.common != null && Object.hasOwnProperty.call(message, "common"))
        $root.douyin.Common.encode(
          message.common,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (message.displayShort != null && Object.hasOwnProperty.call(message, "displayShort"))
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.displayShort);
      if (message.displayMiddle != null && Object.hasOwnProperty.call(message, "displayMiddle"))
        writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.displayMiddle);
      if (message.displayLong != null && Object.hasOwnProperty.call(message, "displayLong"))
        writer.uint32(/* id 4, wireType 2 =*/ 34).string(message.displayLong);
      if (message.displayValue != null && Object.hasOwnProperty.call(message, "displayValue"))
        writer.uint32(/* id 5, wireType 0 =*/ 40).int64(message.displayValue);
      if (message.displayVersion != null && Object.hasOwnProperty.call(message, "displayVersion"))
        writer.uint32(/* id 6, wireType 0 =*/ 48).int64(message.displayVersion);
      if (message.incremental != null && Object.hasOwnProperty.call(message, "incremental"))
        writer.uint32(/* id 7, wireType 0 =*/ 56).bool(message.incremental);
      if (message.isHidden != null && Object.hasOwnProperty.call(message, "isHidden"))
        writer.uint32(/* id 8, wireType 0 =*/ 64).bool(message.isHidden);
      if (message.total != null && Object.hasOwnProperty.call(message, "total"))
        writer.uint32(/* id 9, wireType 0 =*/ 72).int64(message.total);
      if (message.displayType != null && Object.hasOwnProperty.call(message, "displayType"))
        writer.uint32(/* id 10, wireType 0 =*/ 80).int64(message.displayType);
      return writer;
    };

    /**
     * Encodes the specified RoomStatsMessage message, length delimited. Does not implicitly {@link douyin.RoomStatsMessage.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.RoomStatsMessage
     * @static
     * @param {douyin.IRoomStatsMessage} message RoomStatsMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    RoomStatsMessage.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a RoomStatsMessage message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.RoomStatsMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.RoomStatsMessage} RoomStatsMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    RoomStatsMessage.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.RoomStatsMessage();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.common = $root.douyin.Common.decode(reader, reader.uint32());
            break;
          }
          case 2: {
            message.displayShort = reader.string();
            break;
          }
          case 3: {
            message.displayMiddle = reader.string();
            break;
          }
          case 4: {
            message.displayLong = reader.string();
            break;
          }
          case 5: {
            message.displayValue = reader.int64();
            break;
          }
          case 6: {
            message.displayVersion = reader.int64();
            break;
          }
          case 7: {
            message.incremental = reader.bool();
            break;
          }
          case 8: {
            message.isHidden = reader.bool();
            break;
          }
          case 9: {
            message.total = reader.int64();
            break;
          }
          case 10: {
            message.displayType = reader.int64();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a RoomStatsMessage message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.RoomStatsMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.RoomStatsMessage} RoomStatsMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    RoomStatsMessage.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a RoomStatsMessage message.
     * @function verify
     * @memberof douyin.RoomStatsMessage
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    RoomStatsMessage.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.common != null && message.hasOwnProperty("common")) {
        let error = $root.douyin.Common.verify(message.common);
        if (error) return "common." + error;
      }
      if (message.displayShort != null && message.hasOwnProperty("displayShort"))
        if (!$util.isString(message.displayShort)) return "displayShort: string expected";
      if (message.displayMiddle != null && message.hasOwnProperty("displayMiddle"))
        if (!$util.isString(message.displayMiddle)) return "displayMiddle: string expected";
      if (message.displayLong != null && message.hasOwnProperty("displayLong"))
        if (!$util.isString(message.displayLong)) return "displayLong: string expected";
      if (message.displayValue != null && message.hasOwnProperty("displayValue"))
        if (
          !$util.isInteger(message.displayValue) &&
          !(
            message.displayValue &&
            $util.isInteger(message.displayValue.low) &&
            $util.isInteger(message.displayValue.high)
          )
        )
          return "displayValue: integer|Long expected";
      if (message.displayVersion != null && message.hasOwnProperty("displayVersion"))
        if (
          !$util.isInteger(message.displayVersion) &&
          !(
            message.displayVersion &&
            $util.isInteger(message.displayVersion.low) &&
            $util.isInteger(message.displayVersion.high)
          )
        )
          return "displayVersion: integer|Long expected";
      if (message.incremental != null && message.hasOwnProperty("incremental"))
        if (typeof message.incremental !== "boolean") return "incremental: boolean expected";
      if (message.isHidden != null && message.hasOwnProperty("isHidden"))
        if (typeof message.isHidden !== "boolean") return "isHidden: boolean expected";
      if (message.total != null && message.hasOwnProperty("total"))
        if (
          !$util.isInteger(message.total) &&
          !(
            message.total &&
            $util.isInteger(message.total.low) &&
            $util.isInteger(message.total.high)
          )
        )
          return "total: integer|Long expected";
      if (message.displayType != null && message.hasOwnProperty("displayType"))
        if (
          !$util.isInteger(message.displayType) &&
          !(
            message.displayType &&
            $util.isInteger(message.displayType.low) &&
            $util.isInteger(message.displayType.high)
          )
        )
          return "displayType: integer|Long expected";
      return null;
    };

    /**
     * Creates a RoomStatsMessage message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.RoomStatsMessage
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.RoomStatsMessage} RoomStatsMessage
     */
    RoomStatsMessage.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.RoomStatsMessage) return object;
      let message = new $root.douyin.RoomStatsMessage();
      if (object.common != null) {
        if (typeof object.common !== "object")
          throw TypeError(".douyin.RoomStatsMessage.common: object expected");
        message.common = $root.douyin.Common.fromObject(object.common);
      }
      if (object.displayShort != null) message.displayShort = String(object.displayShort);
      if (object.displayMiddle != null) message.displayMiddle = String(object.displayMiddle);
      if (object.displayLong != null) message.displayLong = String(object.displayLong);
      if (object.displayValue != null)
        if ($util.Long)
          (message.displayValue = $util.Long.fromValue(object.displayValue)).unsigned = false;
        else if (typeof object.displayValue === "string")
          message.displayValue = parseInt(object.displayValue, 10);
        else if (typeof object.displayValue === "number")
          message.displayValue = object.displayValue;
        else if (typeof object.displayValue === "object")
          message.displayValue = new $util.LongBits(
            object.displayValue.low >>> 0,
            object.displayValue.high >>> 0,
          ).toNumber();
      if (object.displayVersion != null)
        if ($util.Long)
          (message.displayVersion = $util.Long.fromValue(object.displayVersion)).unsigned = false;
        else if (typeof object.displayVersion === "string")
          message.displayVersion = parseInt(object.displayVersion, 10);
        else if (typeof object.displayVersion === "number")
          message.displayVersion = object.displayVersion;
        else if (typeof object.displayVersion === "object")
          message.displayVersion = new $util.LongBits(
            object.displayVersion.low >>> 0,
            object.displayVersion.high >>> 0,
          ).toNumber();
      if (object.incremental != null) message.incremental = Boolean(object.incremental);
      if (object.isHidden != null) message.isHidden = Boolean(object.isHidden);
      if (object.total != null)
        if ($util.Long) (message.total = $util.Long.fromValue(object.total)).unsigned = false;
        else if (typeof object.total === "string") message.total = parseInt(object.total, 10);
        else if (typeof object.total === "number") message.total = object.total;
        else if (typeof object.total === "object")
          message.total = new $util.LongBits(
            object.total.low >>> 0,
            object.total.high >>> 0,
          ).toNumber();
      if (object.displayType != null)
        if ($util.Long)
          (message.displayType = $util.Long.fromValue(object.displayType)).unsigned = false;
        else if (typeof object.displayType === "string")
          message.displayType = parseInt(object.displayType, 10);
        else if (typeof object.displayType === "number") message.displayType = object.displayType;
        else if (typeof object.displayType === "object")
          message.displayType = new $util.LongBits(
            object.displayType.low >>> 0,
            object.displayType.high >>> 0,
          ).toNumber();
      return message;
    };

    /**
     * Creates a plain object from a RoomStatsMessage message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.RoomStatsMessage
     * @static
     * @param {douyin.RoomStatsMessage} message RoomStatsMessage
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    RoomStatsMessage.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.common = null;
        object.displayShort = "";
        object.displayMiddle = "";
        object.displayLong = "";
        if ($util.Long) {
          let long = new $util.Long(0, 0, false);
          object.displayValue =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.displayValue = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, false);
          object.displayVersion =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.displayVersion = options.longs === String ? "0" : 0;
        object.incremental = false;
        object.isHidden = false;
        if ($util.Long) {
          let long = new $util.Long(0, 0, false);
          object.total =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.total = options.longs === String ? "0" : 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, false);
          object.displayType =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.displayType = options.longs === String ? "0" : 0;
      }
      if (message.common != null && message.hasOwnProperty("common"))
        object.common = $root.douyin.Common.toObject(message.common, options);
      if (message.displayShort != null && message.hasOwnProperty("displayShort"))
        object.displayShort = message.displayShort;
      if (message.displayMiddle != null && message.hasOwnProperty("displayMiddle"))
        object.displayMiddle = message.displayMiddle;
      if (message.displayLong != null && message.hasOwnProperty("displayLong"))
        object.displayLong = message.displayLong;
      if (message.displayValue != null && message.hasOwnProperty("displayValue"))
        if (typeof message.displayValue === "number")
          object.displayValue =
            options.longs === String ? String(message.displayValue) : message.displayValue;
        else
          object.displayValue =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.displayValue)
              : options.longs === Number
                ? new $util.LongBits(
                    message.displayValue.low >>> 0,
                    message.displayValue.high >>> 0,
                  ).toNumber()
                : message.displayValue;
      if (message.displayVersion != null && message.hasOwnProperty("displayVersion"))
        if (typeof message.displayVersion === "number")
          object.displayVersion =
            options.longs === String ? String(message.displayVersion) : message.displayVersion;
        else
          object.displayVersion =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.displayVersion)
              : options.longs === Number
                ? new $util.LongBits(
                    message.displayVersion.low >>> 0,
                    message.displayVersion.high >>> 0,
                  ).toNumber()
                : message.displayVersion;
      if (message.incremental != null && message.hasOwnProperty("incremental"))
        object.incremental = message.incremental;
      if (message.isHidden != null && message.hasOwnProperty("isHidden"))
        object.isHidden = message.isHidden;
      if (message.total != null && message.hasOwnProperty("total"))
        if (typeof message.total === "number")
          object.total = options.longs === String ? String(message.total) : message.total;
        else
          object.total =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.total)
              : options.longs === Number
                ? new $util.LongBits(message.total.low >>> 0, message.total.high >>> 0).toNumber()
                : message.total;
      if (message.displayType != null && message.hasOwnProperty("displayType"))
        if (typeof message.displayType === "number")
          object.displayType =
            options.longs === String ? String(message.displayType) : message.displayType;
        else
          object.displayType =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.displayType)
              : options.longs === Number
                ? new $util.LongBits(
                    message.displayType.low >>> 0,
                    message.displayType.high >>> 0,
                  ).toNumber()
                : message.displayType;
      return object;
    };

    /**
     * Converts this RoomStatsMessage to JSON.
     * @function toJSON
     * @memberof douyin.RoomStatsMessage
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    RoomStatsMessage.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for RoomStatsMessage
     * @function getTypeUrl
     * @memberof douyin.RoomStatsMessage
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    RoomStatsMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.RoomStatsMessage";
    };

    return RoomStatsMessage;
  })();

  douyin.ProductInfo = (function () {
    /**
     * Properties of a ProductInfo.
     * @memberof douyin
     * @interface IProductInfo
     * @property {number|Long|null} [promotionId] ProductInfo promotionId
     * @property {number|null} [index] ProductInfo index
     * @property {Array.<number|Long>|null} [targetFlashUidsList] ProductInfo targetFlashUidsList
     * @property {number|Long|null} [explainType] ProductInfo explainType
     */

    /**
     * Constructs a new ProductInfo.
     * @memberof douyin
     * @classdesc Represents a ProductInfo.
     * @implements IProductInfo
     * @constructor
     * @param {douyin.IProductInfo=} [properties] Properties to set
     */
    function ProductInfo(properties) {
      this.targetFlashUidsList = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * ProductInfo promotionId.
     * @member {number|Long} promotionId
     * @memberof douyin.ProductInfo
     * @instance
     */
    ProductInfo.prototype.promotionId = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;

    /**
     * ProductInfo index.
     * @member {number} index
     * @memberof douyin.ProductInfo
     * @instance
     */
    ProductInfo.prototype.index = 0;

    /**
     * ProductInfo targetFlashUidsList.
     * @member {Array.<number|Long>} targetFlashUidsList
     * @memberof douyin.ProductInfo
     * @instance
     */
    ProductInfo.prototype.targetFlashUidsList = $util.emptyArray;

    /**
     * ProductInfo explainType.
     * @member {number|Long} explainType
     * @memberof douyin.ProductInfo
     * @instance
     */
    ProductInfo.prototype.explainType = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;

    /**
     * Creates a new ProductInfo instance using the specified properties.
     * @function create
     * @memberof douyin.ProductInfo
     * @static
     * @param {douyin.IProductInfo=} [properties] Properties to set
     * @returns {douyin.ProductInfo} ProductInfo instance
     */
    ProductInfo.create = function create(properties) {
      return new ProductInfo(properties);
    };

    /**
     * Encodes the specified ProductInfo message. Does not implicitly {@link douyin.ProductInfo.verify|verify} messages.
     * @function encode
     * @memberof douyin.ProductInfo
     * @static
     * @param {douyin.IProductInfo} message ProductInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ProductInfo.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.promotionId != null && Object.hasOwnProperty.call(message, "promotionId"))
        writer.uint32(/* id 1, wireType 0 =*/ 8).int64(message.promotionId);
      if (message.index != null && Object.hasOwnProperty.call(message, "index"))
        writer.uint32(/* id 2, wireType 0 =*/ 16).int32(message.index);
      if (message.targetFlashUidsList != null && message.targetFlashUidsList.length) {
        writer.uint32(/* id 3, wireType 2 =*/ 26).fork();
        for (let i = 0; i < message.targetFlashUidsList.length; ++i)
          writer.int64(message.targetFlashUidsList[i]);
        writer.ldelim();
      }
      if (message.explainType != null && Object.hasOwnProperty.call(message, "explainType"))
        writer.uint32(/* id 4, wireType 0 =*/ 32).int64(message.explainType);
      return writer;
    };

    /**
     * Encodes the specified ProductInfo message, length delimited. Does not implicitly {@link douyin.ProductInfo.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.ProductInfo
     * @static
     * @param {douyin.IProductInfo} message ProductInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ProductInfo.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a ProductInfo message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.ProductInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.ProductInfo} ProductInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ProductInfo.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.ProductInfo();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.promotionId = reader.int64();
            break;
          }
          case 2: {
            message.index = reader.int32();
            break;
          }
          case 3: {
            if (!(message.targetFlashUidsList && message.targetFlashUidsList.length))
              message.targetFlashUidsList = [];
            if ((tag & 7) === 2) {
              let end2 = reader.uint32() + reader.pos;
              while (reader.pos < end2) message.targetFlashUidsList.push(reader.int64());
            } else message.targetFlashUidsList.push(reader.int64());
            break;
          }
          case 4: {
            message.explainType = reader.int64();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a ProductInfo message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.ProductInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.ProductInfo} ProductInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ProductInfo.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a ProductInfo message.
     * @function verify
     * @memberof douyin.ProductInfo
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ProductInfo.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.promotionId != null && message.hasOwnProperty("promotionId"))
        if (
          !$util.isInteger(message.promotionId) &&
          !(
            message.promotionId &&
            $util.isInteger(message.promotionId.low) &&
            $util.isInteger(message.promotionId.high)
          )
        )
          return "promotionId: integer|Long expected";
      if (message.index != null && message.hasOwnProperty("index"))
        if (!$util.isInteger(message.index)) return "index: integer expected";
      if (message.targetFlashUidsList != null && message.hasOwnProperty("targetFlashUidsList")) {
        if (!Array.isArray(message.targetFlashUidsList))
          return "targetFlashUidsList: array expected";
        for (let i = 0; i < message.targetFlashUidsList.length; ++i)
          if (
            !$util.isInteger(message.targetFlashUidsList[i]) &&
            !(
              message.targetFlashUidsList[i] &&
              $util.isInteger(message.targetFlashUidsList[i].low) &&
              $util.isInteger(message.targetFlashUidsList[i].high)
            )
          )
            return "targetFlashUidsList: integer|Long[] expected";
      }
      if (message.explainType != null && message.hasOwnProperty("explainType"))
        if (
          !$util.isInteger(message.explainType) &&
          !(
            message.explainType &&
            $util.isInteger(message.explainType.low) &&
            $util.isInteger(message.explainType.high)
          )
        )
          return "explainType: integer|Long expected";
      return null;
    };

    /**
     * Creates a ProductInfo message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.ProductInfo
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.ProductInfo} ProductInfo
     */
    ProductInfo.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.ProductInfo) return object;
      let message = new $root.douyin.ProductInfo();
      if (object.promotionId != null)
        if ($util.Long)
          (message.promotionId = $util.Long.fromValue(object.promotionId)).unsigned = false;
        else if (typeof object.promotionId === "string")
          message.promotionId = parseInt(object.promotionId, 10);
        else if (typeof object.promotionId === "number") message.promotionId = object.promotionId;
        else if (typeof object.promotionId === "object")
          message.promotionId = new $util.LongBits(
            object.promotionId.low >>> 0,
            object.promotionId.high >>> 0,
          ).toNumber();
      if (object.index != null) message.index = object.index | 0;
      if (object.targetFlashUidsList) {
        if (!Array.isArray(object.targetFlashUidsList))
          throw TypeError(".douyin.ProductInfo.targetFlashUidsList: array expected");
        message.targetFlashUidsList = [];
        for (let i = 0; i < object.targetFlashUidsList.length; ++i)
          if ($util.Long)
            (message.targetFlashUidsList[i] = $util.Long.fromValue(
              object.targetFlashUidsList[i],
            )).unsigned = false;
          else if (typeof object.targetFlashUidsList[i] === "string")
            message.targetFlashUidsList[i] = parseInt(object.targetFlashUidsList[i], 10);
          else if (typeof object.targetFlashUidsList[i] === "number")
            message.targetFlashUidsList[i] = object.targetFlashUidsList[i];
          else if (typeof object.targetFlashUidsList[i] === "object")
            message.targetFlashUidsList[i] = new $util.LongBits(
              object.targetFlashUidsList[i].low >>> 0,
              object.targetFlashUidsList[i].high >>> 0,
            ).toNumber();
      }
      if (object.explainType != null)
        if ($util.Long)
          (message.explainType = $util.Long.fromValue(object.explainType)).unsigned = false;
        else if (typeof object.explainType === "string")
          message.explainType = parseInt(object.explainType, 10);
        else if (typeof object.explainType === "number") message.explainType = object.explainType;
        else if (typeof object.explainType === "object")
          message.explainType = new $util.LongBits(
            object.explainType.low >>> 0,
            object.explainType.high >>> 0,
          ).toNumber();
      return message;
    };

    /**
     * Creates a plain object from a ProductInfo message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.ProductInfo
     * @static
     * @param {douyin.ProductInfo} message ProductInfo
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ProductInfo.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.targetFlashUidsList = [];
      if (options.defaults) {
        if ($util.Long) {
          let long = new $util.Long(0, 0, false);
          object.promotionId =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.promotionId = options.longs === String ? "0" : 0;
        object.index = 0;
        if ($util.Long) {
          let long = new $util.Long(0, 0, false);
          object.explainType =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.explainType = options.longs === String ? "0" : 0;
      }
      if (message.promotionId != null && message.hasOwnProperty("promotionId"))
        if (typeof message.promotionId === "number")
          object.promotionId =
            options.longs === String ? String(message.promotionId) : message.promotionId;
        else
          object.promotionId =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.promotionId)
              : options.longs === Number
                ? new $util.LongBits(
                    message.promotionId.low >>> 0,
                    message.promotionId.high >>> 0,
                  ).toNumber()
                : message.promotionId;
      if (message.index != null && message.hasOwnProperty("index")) object.index = message.index;
      if (message.targetFlashUidsList && message.targetFlashUidsList.length) {
        object.targetFlashUidsList = [];
        for (let j = 0; j < message.targetFlashUidsList.length; ++j)
          if (typeof message.targetFlashUidsList[j] === "number")
            object.targetFlashUidsList[j] =
              options.longs === String
                ? String(message.targetFlashUidsList[j])
                : message.targetFlashUidsList[j];
          else
            object.targetFlashUidsList[j] =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.targetFlashUidsList[j])
                : options.longs === Number
                  ? new $util.LongBits(
                      message.targetFlashUidsList[j].low >>> 0,
                      message.targetFlashUidsList[j].high >>> 0,
                    ).toNumber()
                  : message.targetFlashUidsList[j];
      }
      if (message.explainType != null && message.hasOwnProperty("explainType"))
        if (typeof message.explainType === "number")
          object.explainType =
            options.longs === String ? String(message.explainType) : message.explainType;
        else
          object.explainType =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.explainType)
              : options.longs === Number
                ? new $util.LongBits(
                    message.explainType.low >>> 0,
                    message.explainType.high >>> 0,
                  ).toNumber()
                : message.explainType;
      return object;
    };

    /**
     * Converts this ProductInfo to JSON.
     * @function toJSON
     * @memberof douyin.ProductInfo
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ProductInfo.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for ProductInfo
     * @function getTypeUrl
     * @memberof douyin.ProductInfo
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    ProductInfo.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.ProductInfo";
    };

    return ProductInfo;
  })();

  douyin.CategoryInfo = (function () {
    /**
     * Properties of a CategoryInfo.
     * @memberof douyin
     * @interface ICategoryInfo
     * @property {number|null} [id] CategoryInfo id
     * @property {string|null} [name] CategoryInfo name
     * @property {Array.<number|Long>|null} [promotionIdsList] CategoryInfo promotionIdsList
     * @property {string|null} [type] CategoryInfo type
     * @property {string|null} [uniqueIndex] CategoryInfo uniqueIndex
     */

    /**
     * Constructs a new CategoryInfo.
     * @memberof douyin
     * @classdesc Represents a CategoryInfo.
     * @implements ICategoryInfo
     * @constructor
     * @param {douyin.ICategoryInfo=} [properties] Properties to set
     */
    function CategoryInfo(properties) {
      this.promotionIdsList = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * CategoryInfo id.
     * @member {number} id
     * @memberof douyin.CategoryInfo
     * @instance
     */
    CategoryInfo.prototype.id = 0;

    /**
     * CategoryInfo name.
     * @member {string} name
     * @memberof douyin.CategoryInfo
     * @instance
     */
    CategoryInfo.prototype.name = "";

    /**
     * CategoryInfo promotionIdsList.
     * @member {Array.<number|Long>} promotionIdsList
     * @memberof douyin.CategoryInfo
     * @instance
     */
    CategoryInfo.prototype.promotionIdsList = $util.emptyArray;

    /**
     * CategoryInfo type.
     * @member {string} type
     * @memberof douyin.CategoryInfo
     * @instance
     */
    CategoryInfo.prototype.type = "";

    /**
     * CategoryInfo uniqueIndex.
     * @member {string} uniqueIndex
     * @memberof douyin.CategoryInfo
     * @instance
     */
    CategoryInfo.prototype.uniqueIndex = "";

    /**
     * Creates a new CategoryInfo instance using the specified properties.
     * @function create
     * @memberof douyin.CategoryInfo
     * @static
     * @param {douyin.ICategoryInfo=} [properties] Properties to set
     * @returns {douyin.CategoryInfo} CategoryInfo instance
     */
    CategoryInfo.create = function create(properties) {
      return new CategoryInfo(properties);
    };

    /**
     * Encodes the specified CategoryInfo message. Does not implicitly {@link douyin.CategoryInfo.verify|verify} messages.
     * @function encode
     * @memberof douyin.CategoryInfo
     * @static
     * @param {douyin.ICategoryInfo} message CategoryInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CategoryInfo.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.id != null && Object.hasOwnProperty.call(message, "id"))
        writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.id);
      if (message.name != null && Object.hasOwnProperty.call(message, "name"))
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.name);
      if (message.promotionIdsList != null && message.promotionIdsList.length) {
        writer.uint32(/* id 3, wireType 2 =*/ 26).fork();
        for (let i = 0; i < message.promotionIdsList.length; ++i)
          writer.int64(message.promotionIdsList[i]);
        writer.ldelim();
      }
      if (message.type != null && Object.hasOwnProperty.call(message, "type"))
        writer.uint32(/* id 4, wireType 2 =*/ 34).string(message.type);
      if (message.uniqueIndex != null && Object.hasOwnProperty.call(message, "uniqueIndex"))
        writer.uint32(/* id 5, wireType 2 =*/ 42).string(message.uniqueIndex);
      return writer;
    };

    /**
     * Encodes the specified CategoryInfo message, length delimited. Does not implicitly {@link douyin.CategoryInfo.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.CategoryInfo
     * @static
     * @param {douyin.ICategoryInfo} message CategoryInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CategoryInfo.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CategoryInfo message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.CategoryInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.CategoryInfo} CategoryInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CategoryInfo.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.CategoryInfo();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.id = reader.int32();
            break;
          }
          case 2: {
            message.name = reader.string();
            break;
          }
          case 3: {
            if (!(message.promotionIdsList && message.promotionIdsList.length))
              message.promotionIdsList = [];
            if ((tag & 7) === 2) {
              let end2 = reader.uint32() + reader.pos;
              while (reader.pos < end2) message.promotionIdsList.push(reader.int64());
            } else message.promotionIdsList.push(reader.int64());
            break;
          }
          case 4: {
            message.type = reader.string();
            break;
          }
          case 5: {
            message.uniqueIndex = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a CategoryInfo message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.CategoryInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.CategoryInfo} CategoryInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CategoryInfo.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CategoryInfo message.
     * @function verify
     * @memberof douyin.CategoryInfo
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CategoryInfo.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.id != null && message.hasOwnProperty("id"))
        if (!$util.isInteger(message.id)) return "id: integer expected";
      if (message.name != null && message.hasOwnProperty("name"))
        if (!$util.isString(message.name)) return "name: string expected";
      if (message.promotionIdsList != null && message.hasOwnProperty("promotionIdsList")) {
        if (!Array.isArray(message.promotionIdsList)) return "promotionIdsList: array expected";
        for (let i = 0; i < message.promotionIdsList.length; ++i)
          if (
            !$util.isInteger(message.promotionIdsList[i]) &&
            !(
              message.promotionIdsList[i] &&
              $util.isInteger(message.promotionIdsList[i].low) &&
              $util.isInteger(message.promotionIdsList[i].high)
            )
          )
            return "promotionIdsList: integer|Long[] expected";
      }
      if (message.type != null && message.hasOwnProperty("type"))
        if (!$util.isString(message.type)) return "type: string expected";
      if (message.uniqueIndex != null && message.hasOwnProperty("uniqueIndex"))
        if (!$util.isString(message.uniqueIndex)) return "uniqueIndex: string expected";
      return null;
    };

    /**
     * Creates a CategoryInfo message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.CategoryInfo
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.CategoryInfo} CategoryInfo
     */
    CategoryInfo.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.CategoryInfo) return object;
      let message = new $root.douyin.CategoryInfo();
      if (object.id != null) message.id = object.id | 0;
      if (object.name != null) message.name = String(object.name);
      if (object.promotionIdsList) {
        if (!Array.isArray(object.promotionIdsList))
          throw TypeError(".douyin.CategoryInfo.promotionIdsList: array expected");
        message.promotionIdsList = [];
        for (let i = 0; i < object.promotionIdsList.length; ++i)
          if ($util.Long)
            (message.promotionIdsList[i] = $util.Long.fromValue(
              object.promotionIdsList[i],
            )).unsigned = false;
          else if (typeof object.promotionIdsList[i] === "string")
            message.promotionIdsList[i] = parseInt(object.promotionIdsList[i], 10);
          else if (typeof object.promotionIdsList[i] === "number")
            message.promotionIdsList[i] = object.promotionIdsList[i];
          else if (typeof object.promotionIdsList[i] === "object")
            message.promotionIdsList[i] = new $util.LongBits(
              object.promotionIdsList[i].low >>> 0,
              object.promotionIdsList[i].high >>> 0,
            ).toNumber();
      }
      if (object.type != null) message.type = String(object.type);
      if (object.uniqueIndex != null) message.uniqueIndex = String(object.uniqueIndex);
      return message;
    };

    /**
     * Creates a plain object from a CategoryInfo message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.CategoryInfo
     * @static
     * @param {douyin.CategoryInfo} message CategoryInfo
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CategoryInfo.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.promotionIdsList = [];
      if (options.defaults) {
        object.id = 0;
        object.name = "";
        object.type = "";
        object.uniqueIndex = "";
      }
      if (message.id != null && message.hasOwnProperty("id")) object.id = message.id;
      if (message.name != null && message.hasOwnProperty("name")) object.name = message.name;
      if (message.promotionIdsList && message.promotionIdsList.length) {
        object.promotionIdsList = [];
        for (let j = 0; j < message.promotionIdsList.length; ++j)
          if (typeof message.promotionIdsList[j] === "number")
            object.promotionIdsList[j] =
              options.longs === String
                ? String(message.promotionIdsList[j])
                : message.promotionIdsList[j];
          else
            object.promotionIdsList[j] =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.promotionIdsList[j])
                : options.longs === Number
                  ? new $util.LongBits(
                      message.promotionIdsList[j].low >>> 0,
                      message.promotionIdsList[j].high >>> 0,
                    ).toNumber()
                  : message.promotionIdsList[j];
      }
      if (message.type != null && message.hasOwnProperty("type")) object.type = message.type;
      if (message.uniqueIndex != null && message.hasOwnProperty("uniqueIndex"))
        object.uniqueIndex = message.uniqueIndex;
      return object;
    };

    /**
     * Converts this CategoryInfo to JSON.
     * @function toJSON
     * @memberof douyin.CategoryInfo
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CategoryInfo.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CategoryInfo
     * @function getTypeUrl
     * @memberof douyin.CategoryInfo
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CategoryInfo.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.CategoryInfo";
    };

    return CategoryInfo;
  })();

  douyin.ProductChangeMessage = (function () {
    /**
     * Properties of a ProductChangeMessage.
     * @memberof douyin
     * @interface IProductChangeMessage
     * @property {douyin.ICommon|null} [common] ProductChangeMessage common
     * @property {number|Long|null} [updateTimestamp] ProductChangeMessage updateTimestamp
     * @property {string|null} [updateToast] ProductChangeMessage updateToast
     * @property {Array.<douyin.IProductInfo>|null} [updateProductInfoList] ProductChangeMessage updateProductInfoList
     * @property {number|Long|null} [total] ProductChangeMessage total
     * @property {Array.<douyin.ICategoryInfo>|null} [updateCategoryInfoList] ProductChangeMessage updateCategoryInfoList
     */

    /**
     * Constructs a new ProductChangeMessage.
     * @memberof douyin
     * @classdesc Represents a ProductChangeMessage.
     * @implements IProductChangeMessage
     * @constructor
     * @param {douyin.IProductChangeMessage=} [properties] Properties to set
     */
    function ProductChangeMessage(properties) {
      this.updateProductInfoList = [];
      this.updateCategoryInfoList = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * ProductChangeMessage common.
     * @member {douyin.ICommon|null|undefined} common
     * @memberof douyin.ProductChangeMessage
     * @instance
     */
    ProductChangeMessage.prototype.common = null;

    /**
     * ProductChangeMessage updateTimestamp.
     * @member {number|Long} updateTimestamp
     * @memberof douyin.ProductChangeMessage
     * @instance
     */
    ProductChangeMessage.prototype.updateTimestamp = $util.Long
      ? $util.Long.fromBits(0, 0, false)
      : 0;

    /**
     * ProductChangeMessage updateToast.
     * @member {string} updateToast
     * @memberof douyin.ProductChangeMessage
     * @instance
     */
    ProductChangeMessage.prototype.updateToast = "";

    /**
     * ProductChangeMessage updateProductInfoList.
     * @member {Array.<douyin.IProductInfo>} updateProductInfoList
     * @memberof douyin.ProductChangeMessage
     * @instance
     */
    ProductChangeMessage.prototype.updateProductInfoList = $util.emptyArray;

    /**
     * ProductChangeMessage total.
     * @member {number|Long} total
     * @memberof douyin.ProductChangeMessage
     * @instance
     */
    ProductChangeMessage.prototype.total = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;

    /**
     * ProductChangeMessage updateCategoryInfoList.
     * @member {Array.<douyin.ICategoryInfo>} updateCategoryInfoList
     * @memberof douyin.ProductChangeMessage
     * @instance
     */
    ProductChangeMessage.prototype.updateCategoryInfoList = $util.emptyArray;

    /**
     * Creates a new ProductChangeMessage instance using the specified properties.
     * @function create
     * @memberof douyin.ProductChangeMessage
     * @static
     * @param {douyin.IProductChangeMessage=} [properties] Properties to set
     * @returns {douyin.ProductChangeMessage} ProductChangeMessage instance
     */
    ProductChangeMessage.create = function create(properties) {
      return new ProductChangeMessage(properties);
    };

    /**
     * Encodes the specified ProductChangeMessage message. Does not implicitly {@link douyin.ProductChangeMessage.verify|verify} messages.
     * @function encode
     * @memberof douyin.ProductChangeMessage
     * @static
     * @param {douyin.IProductChangeMessage} message ProductChangeMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ProductChangeMessage.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.common != null && Object.hasOwnProperty.call(message, "common"))
        $root.douyin.Common.encode(
          message.common,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (message.updateTimestamp != null && Object.hasOwnProperty.call(message, "updateTimestamp"))
        writer.uint32(/* id 2, wireType 0 =*/ 16).int64(message.updateTimestamp);
      if (message.updateToast != null && Object.hasOwnProperty.call(message, "updateToast"))
        writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.updateToast);
      if (message.updateProductInfoList != null && message.updateProductInfoList.length)
        for (let i = 0; i < message.updateProductInfoList.length; ++i)
          $root.douyin.ProductInfo.encode(
            message.updateProductInfoList[i],
            writer.uint32(/* id 4, wireType 2 =*/ 34).fork(),
          ).ldelim();
      if (message.total != null && Object.hasOwnProperty.call(message, "total"))
        writer.uint32(/* id 5, wireType 0 =*/ 40).int64(message.total);
      if (message.updateCategoryInfoList != null && message.updateCategoryInfoList.length)
        for (let i = 0; i < message.updateCategoryInfoList.length; ++i)
          $root.douyin.CategoryInfo.encode(
            message.updateCategoryInfoList[i],
            writer.uint32(/* id 8, wireType 2 =*/ 66).fork(),
          ).ldelim();
      return writer;
    };

    /**
     * Encodes the specified ProductChangeMessage message, length delimited. Does not implicitly {@link douyin.ProductChangeMessage.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.ProductChangeMessage
     * @static
     * @param {douyin.IProductChangeMessage} message ProductChangeMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ProductChangeMessage.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a ProductChangeMessage message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.ProductChangeMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.ProductChangeMessage} ProductChangeMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ProductChangeMessage.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.ProductChangeMessage();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.common = $root.douyin.Common.decode(reader, reader.uint32());
            break;
          }
          case 2: {
            message.updateTimestamp = reader.int64();
            break;
          }
          case 3: {
            message.updateToast = reader.string();
            break;
          }
          case 4: {
            if (!(message.updateProductInfoList && message.updateProductInfoList.length))
              message.updateProductInfoList = [];
            message.updateProductInfoList.push(
              $root.douyin.ProductInfo.decode(reader, reader.uint32()),
            );
            break;
          }
          case 5: {
            message.total = reader.int64();
            break;
          }
          case 8: {
            if (!(message.updateCategoryInfoList && message.updateCategoryInfoList.length))
              message.updateCategoryInfoList = [];
            message.updateCategoryInfoList.push(
              $root.douyin.CategoryInfo.decode(reader, reader.uint32()),
            );
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a ProductChangeMessage message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.ProductChangeMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.ProductChangeMessage} ProductChangeMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ProductChangeMessage.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a ProductChangeMessage message.
     * @function verify
     * @memberof douyin.ProductChangeMessage
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ProductChangeMessage.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.common != null && message.hasOwnProperty("common")) {
        let error = $root.douyin.Common.verify(message.common);
        if (error) return "common." + error;
      }
      if (message.updateTimestamp != null && message.hasOwnProperty("updateTimestamp"))
        if (
          !$util.isInteger(message.updateTimestamp) &&
          !(
            message.updateTimestamp &&
            $util.isInteger(message.updateTimestamp.low) &&
            $util.isInteger(message.updateTimestamp.high)
          )
        )
          return "updateTimestamp: integer|Long expected";
      if (message.updateToast != null && message.hasOwnProperty("updateToast"))
        if (!$util.isString(message.updateToast)) return "updateToast: string expected";
      if (
        message.updateProductInfoList != null &&
        message.hasOwnProperty("updateProductInfoList")
      ) {
        if (!Array.isArray(message.updateProductInfoList))
          return "updateProductInfoList: array expected";
        for (let i = 0; i < message.updateProductInfoList.length; ++i) {
          let error = $root.douyin.ProductInfo.verify(message.updateProductInfoList[i]);
          if (error) return "updateProductInfoList." + error;
        }
      }
      if (message.total != null && message.hasOwnProperty("total"))
        if (
          !$util.isInteger(message.total) &&
          !(
            message.total &&
            $util.isInteger(message.total.low) &&
            $util.isInteger(message.total.high)
          )
        )
          return "total: integer|Long expected";
      if (
        message.updateCategoryInfoList != null &&
        message.hasOwnProperty("updateCategoryInfoList")
      ) {
        if (!Array.isArray(message.updateCategoryInfoList))
          return "updateCategoryInfoList: array expected";
        for (let i = 0; i < message.updateCategoryInfoList.length; ++i) {
          let error = $root.douyin.CategoryInfo.verify(message.updateCategoryInfoList[i]);
          if (error) return "updateCategoryInfoList." + error;
        }
      }
      return null;
    };

    /**
     * Creates a ProductChangeMessage message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.ProductChangeMessage
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.ProductChangeMessage} ProductChangeMessage
     */
    ProductChangeMessage.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.ProductChangeMessage) return object;
      let message = new $root.douyin.ProductChangeMessage();
      if (object.common != null) {
        if (typeof object.common !== "object")
          throw TypeError(".douyin.ProductChangeMessage.common: object expected");
        message.common = $root.douyin.Common.fromObject(object.common);
      }
      if (object.updateTimestamp != null)
        if ($util.Long)
          (message.updateTimestamp = $util.Long.fromValue(object.updateTimestamp)).unsigned = false;
        else if (typeof object.updateTimestamp === "string")
          message.updateTimestamp = parseInt(object.updateTimestamp, 10);
        else if (typeof object.updateTimestamp === "number")
          message.updateTimestamp = object.updateTimestamp;
        else if (typeof object.updateTimestamp === "object")
          message.updateTimestamp = new $util.LongBits(
            object.updateTimestamp.low >>> 0,
            object.updateTimestamp.high >>> 0,
          ).toNumber();
      if (object.updateToast != null) message.updateToast = String(object.updateToast);
      if (object.updateProductInfoList) {
        if (!Array.isArray(object.updateProductInfoList))
          throw TypeError(".douyin.ProductChangeMessage.updateProductInfoList: array expected");
        message.updateProductInfoList = [];
        for (let i = 0; i < object.updateProductInfoList.length; ++i) {
          if (typeof object.updateProductInfoList[i] !== "object")
            throw TypeError(".douyin.ProductChangeMessage.updateProductInfoList: object expected");
          message.updateProductInfoList[i] = $root.douyin.ProductInfo.fromObject(
            object.updateProductInfoList[i],
          );
        }
      }
      if (object.total != null)
        if ($util.Long) (message.total = $util.Long.fromValue(object.total)).unsigned = false;
        else if (typeof object.total === "string") message.total = parseInt(object.total, 10);
        else if (typeof object.total === "number") message.total = object.total;
        else if (typeof object.total === "object")
          message.total = new $util.LongBits(
            object.total.low >>> 0,
            object.total.high >>> 0,
          ).toNumber();
      if (object.updateCategoryInfoList) {
        if (!Array.isArray(object.updateCategoryInfoList))
          throw TypeError(".douyin.ProductChangeMessage.updateCategoryInfoList: array expected");
        message.updateCategoryInfoList = [];
        for (let i = 0; i < object.updateCategoryInfoList.length; ++i) {
          if (typeof object.updateCategoryInfoList[i] !== "object")
            throw TypeError(".douyin.ProductChangeMessage.updateCategoryInfoList: object expected");
          message.updateCategoryInfoList[i] = $root.douyin.CategoryInfo.fromObject(
            object.updateCategoryInfoList[i],
          );
        }
      }
      return message;
    };

    /**
     * Creates a plain object from a ProductChangeMessage message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.ProductChangeMessage
     * @static
     * @param {douyin.ProductChangeMessage} message ProductChangeMessage
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ProductChangeMessage.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) {
        object.updateProductInfoList = [];
        object.updateCategoryInfoList = [];
      }
      if (options.defaults) {
        object.common = null;
        if ($util.Long) {
          let long = new $util.Long(0, 0, false);
          object.updateTimestamp =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.updateTimestamp = options.longs === String ? "0" : 0;
        object.updateToast = "";
        if ($util.Long) {
          let long = new $util.Long(0, 0, false);
          object.total =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long;
        } else object.total = options.longs === String ? "0" : 0;
      }
      if (message.common != null && message.hasOwnProperty("common"))
        object.common = $root.douyin.Common.toObject(message.common, options);
      if (message.updateTimestamp != null && message.hasOwnProperty("updateTimestamp"))
        if (typeof message.updateTimestamp === "number")
          object.updateTimestamp =
            options.longs === String ? String(message.updateTimestamp) : message.updateTimestamp;
        else
          object.updateTimestamp =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.updateTimestamp)
              : options.longs === Number
                ? new $util.LongBits(
                    message.updateTimestamp.low >>> 0,
                    message.updateTimestamp.high >>> 0,
                  ).toNumber()
                : message.updateTimestamp;
      if (message.updateToast != null && message.hasOwnProperty("updateToast"))
        object.updateToast = message.updateToast;
      if (message.updateProductInfoList && message.updateProductInfoList.length) {
        object.updateProductInfoList = [];
        for (let j = 0; j < message.updateProductInfoList.length; ++j)
          object.updateProductInfoList[j] = $root.douyin.ProductInfo.toObject(
            message.updateProductInfoList[j],
            options,
          );
      }
      if (message.total != null && message.hasOwnProperty("total"))
        if (typeof message.total === "number")
          object.total = options.longs === String ? String(message.total) : message.total;
        else
          object.total =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.total)
              : options.longs === Number
                ? new $util.LongBits(message.total.low >>> 0, message.total.high >>> 0).toNumber()
                : message.total;
      if (message.updateCategoryInfoList && message.updateCategoryInfoList.length) {
        object.updateCategoryInfoList = [];
        for (let j = 0; j < message.updateCategoryInfoList.length; ++j)
          object.updateCategoryInfoList[j] = $root.douyin.CategoryInfo.toObject(
            message.updateCategoryInfoList[j],
            options,
          );
      }
      return object;
    };

    /**
     * Converts this ProductChangeMessage to JSON.
     * @function toJSON
     * @memberof douyin.ProductChangeMessage
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ProductChangeMessage.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for ProductChangeMessage
     * @function getTypeUrl
     * @memberof douyin.ProductChangeMessage
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    ProductChangeMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.ProductChangeMessage";
    };

    return ProductChangeMessage;
  })();

  douyin.RoomRank = (function () {
    /**
     * Properties of a RoomRank.
     * @memberof douyin
     * @interface IRoomRank
     * @property {douyin.IUser|null} [user] RoomRank user
     * @property {string|null} [scoreStr] RoomRank scoreStr
     * @property {boolean|null} [profileHidden] RoomRank profileHidden
     */

    /**
     * Constructs a new RoomRank.
     * @memberof douyin
     * @classdesc Represents a RoomRank.
     * @implements IRoomRank
     * @constructor
     * @param {douyin.IRoomRank=} [properties] Properties to set
     */
    function RoomRank(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * RoomRank user.
     * @member {douyin.IUser|null|undefined} user
     * @memberof douyin.RoomRank
     * @instance
     */
    RoomRank.prototype.user = null;

    /**
     * RoomRank scoreStr.
     * @member {string} scoreStr
     * @memberof douyin.RoomRank
     * @instance
     */
    RoomRank.prototype.scoreStr = "";

    /**
     * RoomRank profileHidden.
     * @member {boolean} profileHidden
     * @memberof douyin.RoomRank
     * @instance
     */
    RoomRank.prototype.profileHidden = false;

    /**
     * Creates a new RoomRank instance using the specified properties.
     * @function create
     * @memberof douyin.RoomRank
     * @static
     * @param {douyin.IRoomRank=} [properties] Properties to set
     * @returns {douyin.RoomRank} RoomRank instance
     */
    RoomRank.create = function create(properties) {
      return new RoomRank(properties);
    };

    /**
     * Encodes the specified RoomRank message. Does not implicitly {@link douyin.RoomRank.verify|verify} messages.
     * @function encode
     * @memberof douyin.RoomRank
     * @static
     * @param {douyin.IRoomRank} message RoomRank message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    RoomRank.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.user != null && Object.hasOwnProperty.call(message, "user"))
        $root.douyin.User.encode(
          message.user,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (message.scoreStr != null && Object.hasOwnProperty.call(message, "scoreStr"))
        writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.scoreStr);
      if (message.profileHidden != null && Object.hasOwnProperty.call(message, "profileHidden"))
        writer.uint32(/* id 3, wireType 0 =*/ 24).bool(message.profileHidden);
      return writer;
    };

    /**
     * Encodes the specified RoomRank message, length delimited. Does not implicitly {@link douyin.RoomRank.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.RoomRank
     * @static
     * @param {douyin.IRoomRank} message RoomRank message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    RoomRank.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a RoomRank message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.RoomRank
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.RoomRank} RoomRank
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    RoomRank.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.RoomRank();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.user = $root.douyin.User.decode(reader, reader.uint32());
            break;
          }
          case 2: {
            message.scoreStr = reader.string();
            break;
          }
          case 3: {
            message.profileHidden = reader.bool();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a RoomRank message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.RoomRank
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.RoomRank} RoomRank
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    RoomRank.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a RoomRank message.
     * @function verify
     * @memberof douyin.RoomRank
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    RoomRank.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.user != null && message.hasOwnProperty("user")) {
        let error = $root.douyin.User.verify(message.user);
        if (error) return "user." + error;
      }
      if (message.scoreStr != null && message.hasOwnProperty("scoreStr"))
        if (!$util.isString(message.scoreStr)) return "scoreStr: string expected";
      if (message.profileHidden != null && message.hasOwnProperty("profileHidden"))
        if (typeof message.profileHidden !== "boolean") return "profileHidden: boolean expected";
      return null;
    };

    /**
     * Creates a RoomRank message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.RoomRank
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.RoomRank} RoomRank
     */
    RoomRank.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.RoomRank) return object;
      let message = new $root.douyin.RoomRank();
      if (object.user != null) {
        if (typeof object.user !== "object")
          throw TypeError(".douyin.RoomRank.user: object expected");
        message.user = $root.douyin.User.fromObject(object.user);
      }
      if (object.scoreStr != null) message.scoreStr = String(object.scoreStr);
      if (object.profileHidden != null) message.profileHidden = Boolean(object.profileHidden);
      return message;
    };

    /**
     * Creates a plain object from a RoomRank message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.RoomRank
     * @static
     * @param {douyin.RoomRank} message RoomRank
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    RoomRank.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.user = null;
        object.scoreStr = "";
        object.profileHidden = false;
      }
      if (message.user != null && message.hasOwnProperty("user"))
        object.user = $root.douyin.User.toObject(message.user, options);
      if (message.scoreStr != null && message.hasOwnProperty("scoreStr"))
        object.scoreStr = message.scoreStr;
      if (message.profileHidden != null && message.hasOwnProperty("profileHidden"))
        object.profileHidden = message.profileHidden;
      return object;
    };

    /**
     * Converts this RoomRank to JSON.
     * @function toJSON
     * @memberof douyin.RoomRank
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    RoomRank.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for RoomRank
     * @function getTypeUrl
     * @memberof douyin.RoomRank
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    RoomRank.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.RoomRank";
    };

    return RoomRank;
  })();

  douyin.RoomRankMessage = (function () {
    /**
     * Properties of a RoomRankMessage.
     * @memberof douyin
     * @interface IRoomRankMessage
     * @property {douyin.ICommon|null} [common] RoomRankMessage common
     * @property {Array.<douyin.IRoomRank>|null} [ranks] RoomRankMessage ranks
     */

    /**
     * Constructs a new RoomRankMessage.
     * @memberof douyin
     * @classdesc Represents a RoomRankMessage.
     * @implements IRoomRankMessage
     * @constructor
     * @param {douyin.IRoomRankMessage=} [properties] Properties to set
     */
    function RoomRankMessage(properties) {
      this.ranks = [];
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * RoomRankMessage common.
     * @member {douyin.ICommon|null|undefined} common
     * @memberof douyin.RoomRankMessage
     * @instance
     */
    RoomRankMessage.prototype.common = null;

    /**
     * RoomRankMessage ranks.
     * @member {Array.<douyin.IRoomRank>} ranks
     * @memberof douyin.RoomRankMessage
     * @instance
     */
    RoomRankMessage.prototype.ranks = $util.emptyArray;

    /**
     * Creates a new RoomRankMessage instance using the specified properties.
     * @function create
     * @memberof douyin.RoomRankMessage
     * @static
     * @param {douyin.IRoomRankMessage=} [properties] Properties to set
     * @returns {douyin.RoomRankMessage} RoomRankMessage instance
     */
    RoomRankMessage.create = function create(properties) {
      return new RoomRankMessage(properties);
    };

    /**
     * Encodes the specified RoomRankMessage message. Does not implicitly {@link douyin.RoomRankMessage.verify|verify} messages.
     * @function encode
     * @memberof douyin.RoomRankMessage
     * @static
     * @param {douyin.IRoomRankMessage} message RoomRankMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    RoomRankMessage.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.common != null && Object.hasOwnProperty.call(message, "common"))
        $root.douyin.Common.encode(
          message.common,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (message.ranks != null && message.ranks.length)
        for (let i = 0; i < message.ranks.length; ++i)
          $root.douyin.RoomRank.encode(
            message.ranks[i],
            writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
          ).ldelim();
      return writer;
    };

    /**
     * Encodes the specified RoomRankMessage message, length delimited. Does not implicitly {@link douyin.RoomRankMessage.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.RoomRankMessage
     * @static
     * @param {douyin.IRoomRankMessage} message RoomRankMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    RoomRankMessage.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a RoomRankMessage message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.RoomRankMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.RoomRankMessage} RoomRankMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    RoomRankMessage.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.RoomRankMessage();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.common = $root.douyin.Common.decode(reader, reader.uint32());
            break;
          }
          case 2: {
            if (!(message.ranks && message.ranks.length)) message.ranks = [];
            message.ranks.push($root.douyin.RoomRank.decode(reader, reader.uint32()));
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a RoomRankMessage message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.RoomRankMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.RoomRankMessage} RoomRankMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    RoomRankMessage.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a RoomRankMessage message.
     * @function verify
     * @memberof douyin.RoomRankMessage
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    RoomRankMessage.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.common != null && message.hasOwnProperty("common")) {
        let error = $root.douyin.Common.verify(message.common);
        if (error) return "common." + error;
      }
      if (message.ranks != null && message.hasOwnProperty("ranks")) {
        if (!Array.isArray(message.ranks)) return "ranks: array expected";
        for (let i = 0; i < message.ranks.length; ++i) {
          let error = $root.douyin.RoomRank.verify(message.ranks[i]);
          if (error) return "ranks." + error;
        }
      }
      return null;
    };

    /**
     * Creates a RoomRankMessage message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.RoomRankMessage
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.RoomRankMessage} RoomRankMessage
     */
    RoomRankMessage.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.RoomRankMessage) return object;
      let message = new $root.douyin.RoomRankMessage();
      if (object.common != null) {
        if (typeof object.common !== "object")
          throw TypeError(".douyin.RoomRankMessage.common: object expected");
        message.common = $root.douyin.Common.fromObject(object.common);
      }
      if (object.ranks) {
        if (!Array.isArray(object.ranks))
          throw TypeError(".douyin.RoomRankMessage.ranks: array expected");
        message.ranks = [];
        for (let i = 0; i < object.ranks.length; ++i) {
          if (typeof object.ranks[i] !== "object")
            throw TypeError(".douyin.RoomRankMessage.ranks: object expected");
          message.ranks[i] = $root.douyin.RoomRank.fromObject(object.ranks[i]);
        }
      }
      return message;
    };

    /**
     * Creates a plain object from a RoomRankMessage message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.RoomRankMessage
     * @static
     * @param {douyin.RoomRankMessage} message RoomRankMessage
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    RoomRankMessage.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.arrays || options.defaults) object.ranks = [];
      if (options.defaults) object.common = null;
      if (message.common != null && message.hasOwnProperty("common"))
        object.common = $root.douyin.Common.toObject(message.common, options);
      if (message.ranks && message.ranks.length) {
        object.ranks = [];
        for (let j = 0; j < message.ranks.length; ++j)
          object.ranks[j] = $root.douyin.RoomRank.toObject(message.ranks[j], options);
      }
      return object;
    };

    /**
     * Converts this RoomRankMessage to JSON.
     * @function toJSON
     * @memberof douyin.RoomRankMessage
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    RoomRankMessage.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for RoomRankMessage
     * @function getTypeUrl
     * @memberof douyin.RoomRankMessage
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    RoomRankMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.RoomRankMessage";
    };

    return RoomRankMessage;
  })();

  douyin.ControlMessage = (function () {
    /**
     * Properties of a ControlMessage.
     * @memberof douyin
     * @interface IControlMessage
     * @property {douyin.ICommon|null} [common] ControlMessage common
     * @property {number|null} [status] ControlMessage status
     */

    /**
     * Constructs a new ControlMessage.
     * @memberof douyin
     * @classdesc Represents a ControlMessage.
     * @implements IControlMessage
     * @constructor
     * @param {douyin.IControlMessage=} [properties] Properties to set
     */
    function ControlMessage(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * ControlMessage common.
     * @member {douyin.ICommon|null|undefined} common
     * @memberof douyin.ControlMessage
     * @instance
     */
    ControlMessage.prototype.common = null;

    /**
     * ControlMessage status.
     * @member {number} status
     * @memberof douyin.ControlMessage
     * @instance
     */
    ControlMessage.prototype.status = 0;

    /**
     * Creates a new ControlMessage instance using the specified properties.
     * @function create
     * @memberof douyin.ControlMessage
     * @static
     * @param {douyin.IControlMessage=} [properties] Properties to set
     * @returns {douyin.ControlMessage} ControlMessage instance
     */
    ControlMessage.create = function create(properties) {
      return new ControlMessage(properties);
    };

    /**
     * Encodes the specified ControlMessage message. Does not implicitly {@link douyin.ControlMessage.verify|verify} messages.
     * @function encode
     * @memberof douyin.ControlMessage
     * @static
     * @param {douyin.IControlMessage} message ControlMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ControlMessage.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.common != null && Object.hasOwnProperty.call(message, "common"))
        $root.douyin.Common.encode(
          message.common,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (message.status != null && Object.hasOwnProperty.call(message, "status"))
        writer.uint32(/* id 2, wireType 0 =*/ 16).int32(message.status);
      return writer;
    };

    /**
     * Encodes the specified ControlMessage message, length delimited. Does not implicitly {@link douyin.ControlMessage.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.ControlMessage
     * @static
     * @param {douyin.IControlMessage} message ControlMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ControlMessage.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a ControlMessage message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.ControlMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.ControlMessage} ControlMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ControlMessage.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.ControlMessage();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.common = $root.douyin.Common.decode(reader, reader.uint32());
            break;
          }
          case 2: {
            message.status = reader.int32();
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a ControlMessage message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.ControlMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.ControlMessage} ControlMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ControlMessage.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a ControlMessage message.
     * @function verify
     * @memberof douyin.ControlMessage
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ControlMessage.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.common != null && message.hasOwnProperty("common")) {
        let error = $root.douyin.Common.verify(message.common);
        if (error) return "common." + error;
      }
      if (message.status != null && message.hasOwnProperty("status"))
        if (!$util.isInteger(message.status)) return "status: integer expected";
      return null;
    };

    /**
     * Creates a ControlMessage message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.ControlMessage
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.ControlMessage} ControlMessage
     */
    ControlMessage.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.ControlMessage) return object;
      let message = new $root.douyin.ControlMessage();
      if (object.common != null) {
        if (typeof object.common !== "object")
          throw TypeError(".douyin.ControlMessage.common: object expected");
        message.common = $root.douyin.Common.fromObject(object.common);
      }
      if (object.status != null) message.status = object.status | 0;
      return message;
    };

    /**
     * Creates a plain object from a ControlMessage message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.ControlMessage
     * @static
     * @param {douyin.ControlMessage} message ControlMessage
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ControlMessage.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.common = null;
        object.status = 0;
      }
      if (message.common != null && message.hasOwnProperty("common"))
        object.common = $root.douyin.Common.toObject(message.common, options);
      if (message.status != null && message.hasOwnProperty("status"))
        object.status = message.status;
      return object;
    };

    /**
     * Converts this ControlMessage to JSON.
     * @function toJSON
     * @memberof douyin.ControlMessage
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ControlMessage.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for ControlMessage
     * @function getTypeUrl
     * @memberof douyin.ControlMessage
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    ControlMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.ControlMessage";
    };

    return ControlMessage;
  })();

  douyin.FansclubMessage = (function () {
    /**
     * Properties of a FansclubMessage.
     * @memberof douyin
     * @interface IFansclubMessage
     * @property {douyin.ICommon|null} [commonInfo] FansclubMessage commonInfo
     * @property {number|null} [type] FansclubMessage type
     * @property {string|null} [content] FansclubMessage content
     * @property {douyin.IUser|null} [user] FansclubMessage user
     */

    /**
     * Constructs a new FansclubMessage.
     * @memberof douyin
     * @classdesc Represents a FansclubMessage.
     * @implements IFansclubMessage
     * @constructor
     * @param {douyin.IFansclubMessage=} [properties] Properties to set
     */
    function FansclubMessage(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
    }

    /**
     * FansclubMessage commonInfo.
     * @member {douyin.ICommon|null|undefined} commonInfo
     * @memberof douyin.FansclubMessage
     * @instance
     */
    FansclubMessage.prototype.commonInfo = null;

    /**
     * FansclubMessage type.
     * @member {number} type
     * @memberof douyin.FansclubMessage
     * @instance
     */
    FansclubMessage.prototype.type = 0;

    /**
     * FansclubMessage content.
     * @member {string} content
     * @memberof douyin.FansclubMessage
     * @instance
     */
    FansclubMessage.prototype.content = "";

    /**
     * FansclubMessage user.
     * @member {douyin.IUser|null|undefined} user
     * @memberof douyin.FansclubMessage
     * @instance
     */
    FansclubMessage.prototype.user = null;

    /**
     * Creates a new FansclubMessage instance using the specified properties.
     * @function create
     * @memberof douyin.FansclubMessage
     * @static
     * @param {douyin.IFansclubMessage=} [properties] Properties to set
     * @returns {douyin.FansclubMessage} FansclubMessage instance
     */
    FansclubMessage.create = function create(properties) {
      return new FansclubMessage(properties);
    };

    /**
     * Encodes the specified FansclubMessage message. Does not implicitly {@link douyin.FansclubMessage.verify|verify} messages.
     * @function encode
     * @memberof douyin.FansclubMessage
     * @static
     * @param {douyin.IFansclubMessage} message FansclubMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    FansclubMessage.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.commonInfo != null && Object.hasOwnProperty.call(message, "commonInfo"))
        $root.douyin.Common.encode(
          message.commonInfo,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim();
      if (message.type != null && Object.hasOwnProperty.call(message, "type"))
        writer.uint32(/* id 2, wireType 0 =*/ 16).int32(message.type);
      if (message.content != null && Object.hasOwnProperty.call(message, "content"))
        writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.content);
      if (message.user != null && Object.hasOwnProperty.call(message, "user"))
        $root.douyin.User.encode(
          message.user,
          writer.uint32(/* id 4, wireType 2 =*/ 34).fork(),
        ).ldelim();
      return writer;
    };

    /**
     * Encodes the specified FansclubMessage message, length delimited. Does not implicitly {@link douyin.FansclubMessage.verify|verify} messages.
     * @function encodeDelimited
     * @memberof douyin.FansclubMessage
     * @static
     * @param {douyin.IFansclubMessage} message FansclubMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    FansclubMessage.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a FansclubMessage message from the specified reader or buffer.
     * @function decode
     * @memberof douyin.FansclubMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {douyin.FansclubMessage} FansclubMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    FansclubMessage.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.douyin.FansclubMessage();
      while (reader.pos < end) {
        let tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            message.commonInfo = $root.douyin.Common.decode(reader, reader.uint32());
            break;
          }
          case 2: {
            message.type = reader.int32();
            break;
          }
          case 3: {
            message.content = reader.string();
            break;
          }
          case 4: {
            message.user = $root.douyin.User.decode(reader, reader.uint32());
            break;
          }
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a FansclubMessage message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof douyin.FansclubMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {douyin.FansclubMessage} FansclubMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    FansclubMessage.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a FansclubMessage message.
     * @function verify
     * @memberof douyin.FansclubMessage
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    FansclubMessage.verify = function verify(message) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (message.commonInfo != null && message.hasOwnProperty("commonInfo")) {
        let error = $root.douyin.Common.verify(message.commonInfo);
        if (error) return "commonInfo." + error;
      }
      if (message.type != null && message.hasOwnProperty("type"))
        if (!$util.isInteger(message.type)) return "type: integer expected";
      if (message.content != null && message.hasOwnProperty("content"))
        if (!$util.isString(message.content)) return "content: string expected";
      if (message.user != null && message.hasOwnProperty("user")) {
        let error = $root.douyin.User.verify(message.user);
        if (error) return "user." + error;
      }
      return null;
    };

    /**
     * Creates a FansclubMessage message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof douyin.FansclubMessage
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {douyin.FansclubMessage} FansclubMessage
     */
    FansclubMessage.fromObject = function fromObject(object) {
      if (object instanceof $root.douyin.FansclubMessage) return object;
      let message = new $root.douyin.FansclubMessage();
      if (object.commonInfo != null) {
        if (typeof object.commonInfo !== "object")
          throw TypeError(".douyin.FansclubMessage.commonInfo: object expected");
        message.commonInfo = $root.douyin.Common.fromObject(object.commonInfo);
      }
      if (object.type != null) message.type = object.type | 0;
      if (object.content != null) message.content = String(object.content);
      if (object.user != null) {
        if (typeof object.user !== "object")
          throw TypeError(".douyin.FansclubMessage.user: object expected");
        message.user = $root.douyin.User.fromObject(object.user);
      }
      return message;
    };

    /**
     * Creates a plain object from a FansclubMessage message. Also converts values to other types if specified.
     * @function toObject
     * @memberof douyin.FansclubMessage
     * @static
     * @param {douyin.FansclubMessage} message FansclubMessage
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    FansclubMessage.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.commonInfo = null;
        object.type = 0;
        object.content = "";
        object.user = null;
      }
      if (message.commonInfo != null && message.hasOwnProperty("commonInfo"))
        object.commonInfo = $root.douyin.Common.toObject(message.commonInfo, options);
      if (message.type != null && message.hasOwnProperty("type")) object.type = message.type;
      if (message.content != null && message.hasOwnProperty("content"))
        object.content = message.content;
      if (message.user != null && message.hasOwnProperty("user"))
        object.user = $root.douyin.User.toObject(message.user, options);
      return object;
    };

    /**
     * Converts this FansclubMessage to JSON.
     * @function toJSON
     * @memberof douyin.FansclubMessage
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    FansclubMessage.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for FansclubMessage
     * @function getTypeUrl
     * @memberof douyin.FansclubMessage
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    FansclubMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/douyin.FansclubMessage";
    };

    return FansclubMessage;
  })();

  return douyin;
})());

export { $root as default };
