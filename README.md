  createGrid() {
    const gridSize = 50
    const gridColor = 0xcccccc
    const axisColor = 0xff0000

    const graphics = this.add.graphics()

    for (let x = 0; x <= this.cameras.main.width; x += gridSize) {
      graphics.lineStyle(1, x % (gridSize * 5) === 0 ? axisColor : gridColor)
      graphics.lineBetween(x, 0, x, this.cameras.main.height)
    }

    for (let y = 0; y <= this.cameras.main.height; y += gridSize) {
      graphics.lineStyle(1, y % (gridSize * 5) === 0 ? axisColor : gridColor)
      graphics.lineBetween(0, y, this.cameras.main.width, y)
    }

    for (let x = 0; x <= this.cameras.main.width; x += gridSize * 5) {
      for (let y = 0; y <= this.cameras.main.height; y += gridSize * 5) {
        const text = this.add.text(x, y, `(${x},${y})`, {
          font: '12px Arial',
        })
        text.setOrigin(0.5)
      }
    }
  }