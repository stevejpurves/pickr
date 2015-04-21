describe("Frontend", function() {

	describe("Points", function() {
		it("can be compared", function() {
			var a = new Point(1,2)
			var b = new Point(1,2)
			expect(a.equals(b)).to.be.true

			var c = new Point(2,3)
			expect(a.equals(c)).to.be.false

			var d = new Point(1,2,1)
			expect(a.equals(d)).to.be.true
		});
	});

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
		})

		describe("LOGS pick actions", function() {
			var clock
			var mock_time_now

			before(function() {
				mock_time_now = Date.now()
				clock = sinon.useFakeTimers(mock_time_now)
			})

			after(function() {
				clock.restore()
			})


			it("adding a pick", function() {
				var item = history.log_add(4, new Point(2,3))
				expect(item.idx).to.equal(4)
				expect(item.action).to.equal('add')
				expect(item.point.x).to.equal(2)
				expect(item.point.y).to.equal(3)
				expect(item.timestamp).to.equal(mock_time_now)
			})
			
			it("moving a pick", function() {
				var item = history.log_move(4, new Point(5,6), new Point(1,2))
				expect(item.action).to.equal('move')
				expect(item.idx).to.equal(4)
				expect(item.to.x).to.equal(5)
				expect(item.to.y).to.equal(6)				
				expect(item.from.x).to.equal(1)
				expect(item.from.y).to.equal(2)
				expect(item.timestamp).to.equal(mock_time_now)
			})

			it("removing a pick", function() {
				var item = history.log_remove(7, new Point(7,8))
				expect(item.action).to.equal('remove')
				expect(item.idx).to.equal(7)
				expect(item.point.x).to.equal(7)
				expect(item.point.y).to.equal(8)
				expect(item.timestamp).to.equal(mock_time_now)	
			})

			it("closing a set of picks", function() {
				var item = history.log_close_group(0)
				expect(item.action).to.equal('close')
				expect(item.group).to.equal(0)
				expect(item.timestamp).to.equal(mock_time_now)
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
			var interpretation;

			beforeEach(function() {
				interpretation = new Interpretation(new PickHistory())
			})

			afterEach(function() {
			})

			it("can't undo using a cleared/empty history", function() {
				var mock = sinon.mock(interpretation)
				mock.expects("replace").never()
				mock.expects("remove").never()

				history.undo(interpretation)
				
				mock.verify()
			})

			it("can't undo an undoable action (remove)", function() {
				var mock = sinon.mock(interpretation)
				mock.expects("replace").once()
				mock.expects("remove").never()

				history.log_move()
				history.log_remove(99)
				history.undo(interpretation)
				
				mock.verify()
			})

			it("can undo an add", function() {
				var mock = sinon.mock(interpretation)
				mock.expects("remove").once().withArgs(0)

				history.log_add(0, new Point(1,2))
				history.undo(interpretation)

				mock.verify()
			})

			it("can undo a move", function() {
				var p0 = new Point(1,2)
				var p1 = new Point(3,4)
				interpretation.add(p0)
				interpretation.replace(p0, p1)

				var mock = sinon.mock(interpretation)
				mock.expects("replace").once().withArgs(p1, p0)

				history.log_move(99, p1, p0)
				history.undo(interpretation)

				mock.verify()
			})

			it("can undo a close group", function() {
				var mock = sinon.mock(interpretation)
				mock.expects("set_active_group").once().withArgs(99)

				history.log_close_group(99)
				history.undo(interpretation)

				mock.verify()
			});
		})
	})

	describe("Interpretation", function() {

		it("adding a point annotates it with a group id", function() {
			var interpretation = new Interpretation(new PickHistory())

			var p = new Point(1,2,-1)
			interpretation.add(p)

			expect(p.group).to.equal(0)
		})

		it("adding after closing adds to a new group", function() {
			var history = new PickHistory()
			var mock = sinon.mock(history)
			var interpretation = new Interpretation(history)

			interpretation.add( new Point(1,2) )
			interpretation.new_group()

			var p = new Point(2,3,-1)
			interpretation.add(p)

			expect(p.group).to.equal(1)
		})

	});


})