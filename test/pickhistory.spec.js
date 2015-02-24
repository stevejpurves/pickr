var expect = chai.expect


function PickHistory() {
	var history = []

	this.clear = function() {
		history.push({action:'clear'})
	}
	this.add = function(point) {
		history.push({action: 'add', point: point})
	}
	this.insert = function(idx, point) {
		history.push({action:'insert', idx: idx, point: point})
	}
	this.move = function(idx, to, from) {
		history.push({action:'move', idx: idx, to: to, from: from})
	}
	this.remove = function(idx) {
		history.push({action:'remove', idx: idx})
	}
	this.json = function() {
		return JSON.stringify(history)
	}
	this.last_undoable = function() {
		if (history.length === 0) return
	}
	return this;
}

describe("Frontend", function() {
	
	describe("Pick History", function() {
		
		var history;

		var report = function() {
			return JSON.parse(history.json())
		}

		beforeEach(function() {
			history = new PickHistory();
		})

		it("reports in json", function() {
			expect(history.json()).to.be.a('string')
			expect(function() {report()}).to.not.throw(Error)
		})

		it("returns an empty array, when empty", function() {
			expect(report()).to.be.empty
		})

		describe("LOGS pick actions", function() {
			it("adding a pick", function() {
				var p = new Point(2,3)
				history.add(p)
				expect(report()[0].action).to.equal('add')
				expect(report()[0].point.x).to.equal(2)
				expect(report()[0].point.y).to.equal(3)
			})

			it("inserting a pick", function() {
				history.insert(3, new Point(3,4))
				expect(report()[0].action).to.equal('insert')
				expect(report()[0].idx).to.equal(3)
				expect(report()[0].point.x).to.equal(3)
				expect(report()[0].point.y).to.equal(4)
			})
			
			it("moving a pick", function() {
				history.move(4, new Point(5,6), new Point(1,2))
				expect(report()[0].action).to.equal('move')
				expect(report()[0].idx).to.equal(4)
				expect(report()[0].to.x).to.equal(5)
				expect(report()[0].to.y).to.equal(6)				
				expect(report()[0].from.x).to.equal(1)
				expect(report()[0].from.y).to.equal(2)
			})

			it("removing a pick", function() {
				history.remove(7)
				expect(report()[0].action).to.equal('remove')
				expect(report()[0].idx).to.equal(7)
			})

			it("clearing all picks", function() {
				history.clear()
				expect(report()[0].action).to.equal('clear')
			})
		})
	})
})