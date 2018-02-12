'use strict'
var Alexa = require('alexa-sdk')
var AWS = require('aws-sdk')

AWS.config.update({
  region: 'ap-northeast-1'
})

const MAX_ITEM = 5929

function randomPk () {
  return 'pk' + (Math.floor(Math.random() * MAX_ITEM) + 1)
}

var docClient = new AWS.DynamoDB.DocumentClient()
exports.doc = docClient

exports.handler = function (event, context) {
  var alexa = Alexa.handler(event, context)
  alexa.registerHandlers(handlers)
  alexa.execute()
}

var handlers = {
  'LaunchRequest': function () {
    this.emit('SayPark')
  },
  'UrbanparkIntent': function () {
    this.emit('SayPark')
  },
  'FindByPlaceIntent': function () {
    this.emit('SayParkByPlace')
  },
  'SayPark': function () {
    const pk = randomPk()
    const params = {
      TableName: 'parks',
      Key: {
        id: pk
      }
    }
    const self = this

    docClient.get(params, function (err, data) {
      if (err) {
        self.response.speak('見つかりませんでした')
          .cardRenderer('Not found', '')
        self.emit(':responseReady')
      } else {
        const park = data.Item
        console.log('dynamo scan succeed: ' + park.id)
        self.response.speak('おすすめの公園は ' + park.Nop)
          .cardRenderer('おすすめの公園', JSON.stringify(park))
        self.emit(':responseReady')
      }
    })
  },
  'SayParkByPlace': function () {
    var name = this.event.request.intent.slots.place.value
    var params = {
      TableName: 'parks',
      FilterExpression: 'contains(Cop, :val)',
      ExpressionAttributeValues: {':val': name}
    }
    var self = this
    docClient.scan(params, function (err, data) {
      if (err) {
        self.response.speak('見つかりませんでした')
          .cardRenderer('Not found', err)
        self.emit(':responseReady')
      } else {
        const park = data.Items[Math.floor(Math.random() * data.Count)]
        console.log('dynamo scan succeed: ' + park.id)
        self.response.speak(name + 'のおすすめの公園は ' + park.Nop)
          .cardRenderer(name + 'のおすすめの公園', JSON.stringify(park))
        self.emit(':responseReady')
      }
    })
  },
  'SessionEndedRequest': function () {
    console.log('Session ended with reason: ' + this.event.request.reason)
  },
  'AMAZON.StopIntent': function () {
    this.response.speak('ご利用ありがとうございました')
    this.emit(':responseReady')
  },
  'AMAZON.HelpIntent': function () {
    this.response.speak("'alexa, 都市公園カタログ' または 'alexa, 都市公園カタログで公園'と話かけてください")
    this.emit(':responseReady')
  },
  'AMAZON.CancelIntent': function () {
    this.response.speak('ご利用ありがとうございました')
    this.emit(':responseReady')
  },
  'Unhandled': function () {
    this.response.speak("'alexa, 都市公園カタログ' または 'alexa, 都市公園カタログで公園'と話かけてください")
  }
}
