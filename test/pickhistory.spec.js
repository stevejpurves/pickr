// var expect = chai.expect




describe("Frontend", function() {
	
	describe("Pick History", function() {
		
		var history;

		var report = function() {
			return JSON.parse(history.json())
		}

		beforeEach(function() {
			history = new PickHistory();
		})

		it("can be cleared", function() {
			history.log_add(1)
			history.clear()
			expect(report()).to.be.empty
		});

		describe("LOGS pick actions", function() {
			it("adding a pick", function() {
				var item = history.log_add(4, new Point(2,3))
				expect(item.idx).to.equal(4)
				expect(item.action).to.equal('add')
				expect(item.point.x).to.equal(2)
				expect(item.point.y).to.equal(3)
			})
			
			it("moving a pick", function() {
				var item = history.log_move(4, new Point(5,6), new Point(1,2))
				expect(item.action).to.equal('move')
				expect(item.idx).to.equal(4)
				expect(item.to.x).to.equal(5)
				expect(item.to.y).to.equal(6)				
				expect(item.from.x).to.equal(1)
				expect(item.from.y).to.equal(2)
			})

			it("removing a pick", function() {
				var item = history.log_remove(7, new Point(7,8))
				expect(item.action).to.equal('remove')
				expect(item.idx).to.equal(7)
				expect(item.point.x).to.equal(7)
				expect(item.point.y).to.equal(8)				
			})
		})

		describe("reports", function() {
			it("in json", function() {
				expect(history.json()).to.be.a('string')
				expect(function() {report()}).to.not.throw(Error)
			})

			it("are empty when no history", function() {
				expect(report()).to.be.empty
			})

			it("have all history items listed in order", function() {
				history.log_add(4, new Point(2,3))
				history.log_move(4, new Point(5,6), new Point(1,2))
				history.log_remove(7, new Point(7,8))

				expect(report()[0].action).to.equal('add')
				expect(report()[0].idx).to.equal(4)
				expect(report()[0].point.x).to.equal(2)
				expect(report()[0].point.y).to.equal(3)
				expect(report()[1].action).to.equal('move')
				expect(report()[1].idx).to.equal(4)
				expect(report()[1].to.x).to.equal(5)
				expect(report()[1].to.y).to.equal(6)				
				expect(report()[1].from.x).to.equal(1)
				expect(report()[1].from.y).to.equal(2)	
				expect(report()[2].action).to.equal('remove')
				expect(report()[2].idx).to.equal(7)
				expect(report()[2].point.x).to.equal(7)
				expect(report()[2].point.y).to.equal(8)			
			})
		})

		describe("undo the corresponding interpretation", function() {



			it("can't undo using a cleared history", function() {
				


			});
		});
	})
})