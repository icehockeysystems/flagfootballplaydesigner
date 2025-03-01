import paper, {
  view,
  project,
  tools,
  tool,
  Tool,
  Group,
  Path,
  Point,
  PointText,
  Color,
  Rectangle,
  Layer,
  Size,
  Raster,
} from "paper"
import miniSvgDataUri from "mini-svg-data-uri"

var index = 0;

class Canvas {

  // Variables.
  index = 0;
  view = null
  project = null

  // Settings.
  scalingWidth = 900
  strokeWidth = 1

  // Tool settings.
  toolActive = null
  toolProps = {}
  toolColor = "black"
  toolIcon = ""

  // State variables.
  pathGroup = null
  path1 = null
  path2 = null
  arrowPath = null
  stopPath1 = null
  stopPath2 = null
  arcClockwise = true
  bgItem = null
  logoItem = null
  bgFillItem = null
  customBgItem = null
  activeItem = null
  activeItemOffset = null
  states = []
  stateIndex = -1
  handleChange = () => {}
  scale = 1
  selectionStart = null;
  selectionPath = null;
  copiedItems = null;

  // Initialize the canvas with paper.js.
  init(element, modeStrokeWidth, onChange) {
    var that = this

    // Initialize canvas with paper.js.
    paper.setup(element)
    this.handleChange = onChange

    this.view = view
    this.project = project
    this.index = project.getIndex()

    // Set initial scale.
    this.scale = this.view.size.width / this.scalingWidth

    // Set stroke width.
    this.strokeWidth = modeStrokeWidth

    // Resize when resizing. :)
    this.view.onResize = () => {
      this.resize()
    }

    // Add a background fill item, which helps with resizing.
    this.bgFillItem = new Path.Rectangle(this.view.bounds)
    this.bgFillItem.locked = true
    this.bgFillItem.name = "background-fill"

    // Add each tool and set the tool name and cursor as arbitrary properties.
    this.customTools.forEach(tool => {
      let _tool = new Tool(tool.props)
      _tool.name = tool.name
      _tool.cursor = tool.cursor
      _tool.index = that.index
    })
  }

  // Find active variants.
  findActiveVariant(variants) {
    // Return active variant if it was saved in layer name.
    if (this.project.activeLayer.name) {
      for (let i = 0; i <= variants.length; i++) {
        if (variants[i].name === this.project.activeLayer.name) {
          return variants[i]
        }
      }
    }

    return variants[0]
  }

  // Sets the background image.
  setBackground(svg, variantLogo, modeLogo, customLogo, variantName) {
    var that = this;

    // Save variant name to layer name.
    this.project.activeLayer.name = variantName;

    // Remove previous background and logo items.
    if (this.project.activeLayer.children.background) {
      this.project.activeLayer.children.background.remove()
    }
    if (this.project.activeLayer.children.logo) {
      this.project.activeLayer.children.logo.remove()
    }

    // Add the background image, lock it (to disable its mouse interactions),
    // name it (so we can access it more easily), and expand it to fit the paper
    // bounds.
    this.bgItem = this.project.importSVG(svg)
    this.bgItem.locked = true
    this.bgItem.name = "background"
    this.bgItem.fitBounds(this.view.bounds)

    // Define function to be executed after importing the logo. Needed because
    // the raster import requires an onLoad function, which can cause a state
    // saving issue if done out of order.
    const finishSetBackground = () => {
      // Lock, name, rotate, and set opacity of logo.
      that.logoItem.locked = true
      that.logoItem.name = "logo"
      if (variantLogo.rotate) {
        that.logoItem.rotate(variantLogo.rotate)
      }
      that.logoItem.opacity = .5

      // Send logo, background, and the background rectangle to the back.
      that.logoItem.sendToBack()
      that.bgItem.sendToBack()
      if (that.bgFillItem) {
        that.bgFillItem.sendToBack()
      }

      that.saveState()
    }

    // Add the logo. A custom logo is a raster image and needs to be positioned
    // with a center point and then scaled.
    if (customLogo) {
      this.logoItem = new Raster(customLogo)
      this.logoItem.onLoad = () => {
        this.logoItem.position = new Point(variantLogo.position[0] * this.view.size.width, variantLogo.position[1] * this.view.size.height)
        this.logoItem.scale((variantLogo.width * this.view.size.width) / Math.max(this.logoItem.width, this.logoItem.height))
        finishSetBackground()
      }
    }

    // A mode logo is a SVG of 100x100 and needs to be positioned and scaled with
    // bounds.
    else {
      this.logoItem = this.project.importSVG(modeLogo)
      const logoItemWidth = variantLogo.width * this.view.size.width
      this.logoItem.bounds = new Rectangle((variantLogo.position[0] * this.view.size.width) - (logoItemWidth / 2), (variantLogo.position[1] * this.view.size.height) - (logoItemWidth / 2), logoItemWidth, logoItemWidth)
      finishSetBackground()
    }
  }

  // Activates a tool.
  activateTool(toolName, props, color, icon) {
    var that = this

    // Activate tool.
    const tool = tools.find(tool => tool.name === toolName && tool.index === that.index)
    tool.activate()

    // Tool settings.
    this.toolActive = tool
    this.toolProps = props
    this.toolColor = color
    this.toolIcon = icon

    // Set cursor. For "icon", use the SVG icon as the cursor, temporarily
    // setting it to something else to avoid Safari showing the old cursor.
    if (tool.cursor === "icon") {
      this.view.element.style.setProperty("cursor", "pointer")
      this.view.element.style.setProperty("cursor", this.svgCursor(this.toolIcon, this.toolProps.size, this.toolColor))
    }
    else {
      this.view.element.style.setProperty("cursor", tool.cursor)
    }
  }

  // Transforms the active layer to fit the paper bounds and adjusts scaling.
  resize() {
    var that = this;

    this.project.activeLayer.fitBounds(this.view.bounds)
    this.scale = this.view.size.width / this.scalingWidth

    // Resize custom background if it exists
    if (this.customBgItem) {
      this.customBgItem.fitBounds(this.view.bounds);
    }

    // Find all "path" tools and scale the stroke width and dash array.
    this.project.activeLayer.children.forEach(item => {
      if (item.data.tool === "path") {
        item.children.forEach(child => {
          if (child.strokeWidth) {
            child.strokeWidth = that.strokeWidth * that.scale
          }
          if (child.dashArray.length) {
            child.dashArray = [5 * that.scale, 7 * that.scale]
          }
        })
      }
    })
  }

  // Sets active canvas.
  setActive() {
    paper.project = this.project
    this.toolActive.activate()
  }

  // Sets project state to previous state.
  undo() {
    if (this.stateIndex > 0) {
      this.project.clear()
      this.project.importJSON(this.states[--this.stateIndex])
      this.resize()
      this.handleChange(this.states[this.stateIndex])
    }
  }

  // Sets project state to next state.
  redo() {
    if (this.stateIndex + 1 < this.states.length) {
      this.project.clear()
      this.project.importJSON(this.states[++this.stateIndex])
      this.resize()
      this.handleChange(this.states[this.stateIndex])
    }
  }

  // Imports JSON.
  importJSON(json) {
    this.project.clear()
    this.project.importJSON(json)
    this.resize()
    this.saveState()
  }

  // Erases canvas by restoring initial state.
  erase() {
    this.states.length = 1
    this.stateIndex = 0
    this.project.clear()
    this.project.importJSON(this.states[this.stateIndex])
    this.resize()
    this.handleChange(this.states[this.stateIndex])
  }

  // Is empty if we only have locked items (the background images).
  isEmpty() {
    if (!this.project) {
      this.project = project
    }

    return !this.project.activeLayer.children.reduce((count, item) => !item.locked ? count + 1 : count, 0)
  }

  // Prints project SVG to the console.
  debugSVG() {
    console.log(this.project.exportSVG({asString: true}))
  }

  // Saves project state, then manually updates the view to ensure canvas is
  // drawn and up-to-date so it can be exported (e.g. toDataURL).
  saveState() {
    this.states.length = this.stateIndex + 1
    this.states.push(this.project.exportJSON({asString: false}))
    this.stateIndex++
    this.view.update()
    this.handleChange(this.states[this.stateIndex])
  }

  // Sets cursor to SVG.
  svgCursor(svg, size, color) {
    const sizeScaled = (size || 30) * this.scale
    const svgReplaced = svg
      .replace(/1em/g, sizeScaled + "px")
      .replace(/currentColor/g, color)
      .replace(/ data-paper-data='[^']+'/g, "")
    const uri = miniSvgDataUri(svgReplaced)
    return `url("${uri}") ${sizeScaled / 2} ${sizeScaled / 2}, auto`
  }

  // Updates stroke and fill color for item and item's children, skipping as
  // necessary. Useful to avoid filling in a white area within a shape.
  paintItem(item, color) {
    var that = this;
    const _color = color || this.toolColor
    item.children.forEach(child => {
      if (child.strokeColor && !child.data.skipStroke) {
        child.strokeColor = _color
      }
      if (child.fillColor && !child.data.skipFill) {
        child.fillColor = _color
      }
      if (child.hasChildren()) {
        that.paintItem(child, _color)
      }
    })
  }

  // Performs hit test and returns top level parent non-layer item, optionally
  // matched by tool type.
  getHitTestItem(point, toolType) {
    const hitResult = this.project.hitTest(point, {
      segments: false,
      stroke: true,
      fill: true,
      tolerance: 10,
    })
    if (hitResult) {
      let item = hitResult.item
      do {
        item = item.parent
      } while (item.parent.className !== "Layer" && (!toolType || item.data.tool === toolType))
      return item
    }
  }

  // Given an array of sizes, find the next size in an array. This is done by
  // finding the nearest size down, and then the next size up from that, wrapping
  // to the lowest size if needed.
  getNextSize(sizes, currentSize) {
    const nearestSizeDown = sizes.slice().reverse().concat(0).reduce((a, b) => currentSize < a ? b : a)
    return sizes[(sizes.indexOf(nearestSizeDown) + 1) % sizes.length]
  }

  // Define our tools.
  customTools = []

  // Add this method to handle custom background
  setCustomBackground(imageData) {
    // Remove existing custom background if any
    if (this.customBgItem) {
      this.customBgItem.remove();
    }

    // Create new raster from image data
    this.customBgItem = new Raster(imageData);
    
    // When the image loads, position and scale it
    this.customBgItem.onLoad = () => {
      // Calculate target width (10% of canvas width)
      const targetWidth = this.view.bounds.width * 0.1;
      
      // Calculate scale factor to maintain aspect ratio
      const scale = targetWidth / this.customBgItem.bounds.width;
      
      // Scale the image
      this.customBgItem.scale(scale);
      
      // Center the image on the canvas
      this.customBgItem.position = this.view.center;
      
      // Set opacity to 50%
      this.customBgItem.opacity = 0.5;
      
      this.customBgItem.locked = true;
      this.customBgItem.name = "custom-background";
      
      // Place above the default background (bgItem) but below other elements
      if (this.bgItem) {
        this.customBgItem.insertAbove(this.bgItem);
      } else {
        // If no bgItem exists yet, insert above bgFillItem
        if (this.bgFillItem) {
          this.customBgItem.insertAbove(this.bgFillItem);
        }
      }
      
      this.saveState();
    };
  }

  constructor() {
    var that = this;

    this.index = index++

    // Path tool.
    this.customTools.push({
      name: "path",
      cursor: "crosshair",
      props: {
        onMouseDown: event => {
          // Define min and max distance.
          switch (that.toolProps.type) {
            case "waves":
            case "waves-straight":
            case "ladder":
              that.toolActive.minDistance = 10 * that.scale
              that.toolActive.maxDistance = 10 * that.scale
              break
            case "arcs":
              that.toolActive.minDistance = 20 * that.scale
              that.toolActive.maxDistance = 20 * that.scale
              break
            default:
              that.toolActive.minDistance = 4 * that.scale
              break
          }

          // Initialize path group.
          that.pathGroup = new Group({
            data: {
              tool: "path",
              type: that.toolProps.type,
              arrow: that.toolProps.arrow,
              stop: that.toolProps.stop,
              withDot: that.toolProps.withDot,
            },
          })
          that.pathGroup.scale(that.scale)

          // Initialize the path(s).
          if (!that.toolProps.type || ["straight", "dashed", "dashed-straight", "waves", "waves-straight", "double"].includes(that.toolProps.type)) {
            that.path1 = new Path({
              strokeColor: that.toolColor,
              strokeWidth: that.strokeWidth * that.scale,
            })
            that.pathGroup.addChild(that.path1)

            if (["dashed", "dashed-straight"].includes(that.toolProps.type)) {
              that.path1.strokeCap = "round"
              that.path1.dashArray = [5 * that.scale, 7 * that.scale]
            }

            if (["waves", "waves-straight"].includes(that.toolProps.type)) {
              that.arcClockwise = false
              that.path1.moveTo(event.point)
            }

            if (that.toolProps.type === "double") {
              that.path2 = new Path({
                strokeColor: that.toolColor,
                strokeWidth: that.strokeWidth * that.scale,
              })
              that.pathGroup.addChild(that.path2)
            }
          }

          // Initialize the arrow.
          if (that.toolProps.arrow) {
            that.arrowPath = new Path({
              strokeColor: that.toolColor,
              strokeWidth: that.strokeWidth * that.scale,
            })
            that.pathGroup.addChild(that.arrowPath)
          }

          // Initialize the stop.
          if (that.toolProps.stop) {
            that.stopPath1 = new Path({
              strokeColor: that.toolColor,
              strokeWidth: that.strokeWidth * that.scale,
            })
            that.pathGroup.addChild(that.stopPath1)
            that.stopPath2 = new Path({
              strokeColor: that.toolColor,
              strokeWidth: that.strokeWidth * that.scale,
            })
            that.pathGroup.addChild(that.stopPath2)
          }
        },
        onMouseDrag: event => {
          // Draw the path.
          switch (that.toolProps.type) {
            case "straight":
            case "dashed-straight":
              that.path1.removeSegments()
              that.path1.add(event.downPoint, event.point)
              break

            case "double":
              let offset = event.delta
              offset.length = 3 * that.scale
              offset.angle = event.downPoint.subtract(event.point).angle + 90

              that.path1.removeSegments()
              that.path2.removeSegments()
              that.path1.add(event.downPoint.subtract(offset), event.point.subtract(offset))
              that.path2.add(event.downPoint.add(offset), event.point.add(offset))
              break

            case "waves":
              that.arcClockwise = !that.arcClockwise
              that.path1.arcTo(event.point, that.arcClockwise)
              break

            case "waves-straight":
              const points = Math.round(event.point.getDistance(event.downPoint) / (10 * that.scale))
              const angle = event.point.subtract(event.downPoint).angle
              that.arcClockwise = false
              that.path1.removeSegments()
              that.path1.add(event.downPoint)
              for (let i = 1; i <= points; i++) {
                const nextPoint = event.downPoint.add(new Point({
                  length: 10 * that.scale * i,
                  angle: angle,
                }))
                that.path1.arcTo(nextPoint, that.arcClockwise)
                that.arcClockwise = !that.arcClockwise
              }
              break

            case "arcs":
              that.path1 = new Path({
                strokeColor: that.toolColor,
                strokeWidth: that.strokeWidth * that.scale,
                segments: [new Point(0, that.strokeWidth * that.scale)],
              })
              that.path2 = new Path({
                strokeColor: that.toolColor,
                strokeWidth: that.strokeWidth * that.scale,
                segments: [new Point(5 * that.scale, that.strokeWidth * 2 * that.scale)],
              })

              that.path1.arcTo(new Point(10 * that.scale, that.strokeWidth * that.scale))
              that.path2.arcTo(new Point(15 * that.scale, that.strokeWidth * 2 * that.scale), false)

              let arcGroup = that.pathGroup.addChild(new Group([that.path2, that.path1]))

              if (that.toolProps.withDot) {
                arcGroup.addChild(new Path.Circle({
                  center: new Point(10 * that.scale, that.strokeWidth * that.scale),
                  radius: that.strokeWidth * that.scale,
                  fillColor: that.toolColor,
                  strokeWidth: that.strokeWidth * that.scale,
                  strokeColor: that.toolColor,
                }))
              }

              arcGroup.position = event.middlePoint
              arcGroup.rotate(event.lastPoint.subtract(event.middlePoint).angle)
              break

            case "ladder":
              that.path1 = new Path({
                strokeColor: that.toolColor,
                strokeWidth: that.strokeWidth * that.scale,
              })
              that.pathGroup.addChild(that.path1)

              const vector = event.delta
              vector.angle += 90
              vector.length = 5 * that.scale

              that.path1.moveTo(event.middlePoint.subtract(vector))
              that.path1.lineTo(event.middlePoint.add(vector))
              break

            default:
              that.path1.add(event.point)
              break
          }

          // Draw the arrow.
          if (that.toolProps.arrow) {
            const vector = (["straight", "dashed-straight", "waves-straight", "double"].includes(that.toolProps.type)
              ? event.downPoint.subtract(event.point)
              : event.middlePoint.subtract(event.point)
            ).normalize()
            const avector = vector.normalize(10 * that.scale)
            that.arrowPath.removeSegments()

            if (["dashed", "dashed-straight", "double", "waves", "waves-straight", "ladder", "arcs"].includes(that.toolProps.type)) {
              const addvector = vector.normalize(10 * that.scale)
              that.arrowPath.add(event.point.subtract(addvector).add(avector.rotate(45)))
              that.arrowPath.add(event.point.subtract(addvector))
              that.arrowPath.add(event.point.subtract(addvector).subtract(avector.rotate(135)))
            }
            else {
              that.arrowPath.add(event.point.add(avector.rotate(45)))
              that.arrowPath.add(event.point)
              that.arrowPath.add(event.point.subtract(avector.rotate(135)))
            }
          }

          // Draw the stop.
          if (that.toolProps.stop) {
            const avector = (["straight", "dashed-straight", "waves-straight", "double"].includes(that.toolProps.type)
              ? event.downPoint.subtract(event.point)
              : event.middlePoint.subtract(event.point)
            ).normalize()
            const vector = event.point
            vector.angle = avector.angle + 90
            vector.length = 10 * that.scale

            const normalize1 = (["dashed", "dashed-straight", "double", "waves", "waves-straight", "ladder", "arcs"].includes(that.toolProps.type) ? 20 : 8) * that.scale
            const normalize2 = (["dashed", "dashed-straight", "double", "waves", "waves-straight", "ladder", "arcs"].includes(that.toolProps.type) ? 16 : 4) * that.scale

            that.stopPath1.removeSegments()
            that.stopPath1.add(event.point.subtract(avector.normalize(normalize1)).subtract(vector))
            that.stopPath1.add(event.point.subtract(avector.normalize(normalize1)).add(vector))

            that.stopPath2.removeSegments()
            that.stopPath2.add(event.point.subtract(avector.normalize(normalize2)).subtract(vector))
            that.stopPath2.add(event.point.subtract(avector.normalize(normalize2)).add(vector))
          }
        },
        onMouseUp: event => {
          if (!that.toolProps.type) {
            that.path1.smooth(10 * that.scale)
            that.path1.simplify(10 * that.scale)
          }
          that.saveState()
        },
      },
    })

    // Dot tool.
    this.customTools.push({
      name: "dot",
      cursor: "icon",
      props: {
        onMouseUp: event => {
          const dotItem = new Path.Circle({
            position: event.point,
            center: new Point(0, 0),
            radius: that.toolProps.radius || 3,
            fillColor: that.toolColor,
            strokeWidth: 1,
            strokeColor: new Color(255, 255, 255, .5),
            data: {skipStroke: true},
          })
          that.pathGroup = new Group({
            children: [dotItem],
            data: {
              tool: "dot",
              radius: that.toolProps.radius,
              count: that.toolProps.count,
            },
          })

          if (that.toolProps.count > 1) {
            for (var i = 1; i < that.toolProps.count; i++) {
              let dotItem2 = dotItem.clone()
              const offset1 = (i % 2) === 0 ? 15 : -15
              const offset2 = (i % 3) === 0 || (i % 4) === 0 ? 15 : -15
              dotItem2.position = event.point.add(new Point(Math.random() * offset1, Math.random() * offset2))
              that.pathGroup.addChild(dotItem2)
            }
          }

          that.pathGroup.scale(that.scale)
          that.saveState()
        },
      },
    })

    // SVG tool.
    this.customTools.push({
      name: "svg",
      cursor: "icon",
      props: {
        onMouseUp: event => {
          const size = that.toolProps.size || 30
          const svgItem = that.project.importSVG(that.toolIcon)
          svgItem.bounds = new Rectangle(event.point.subtract(size / 2), new Size(size, size))
          that.pathGroup = new Group({
            children: [svgItem],
            data: {
              tool: "svg",
              id: that.toolProps.id,
              size: that.toolProps.size,
            },
          })
          that.pathGroup.scale(that.scale)
          that.paintItem(that.pathGroup)
          that.saveState()
        },
      },
    })

    // Text tool.
    this.customTools.push({
      name: "text",
      cursor: null,
      props: {
        onMouseMove: event => {
          that.view.element.style.setProperty("cursor", that.getHitTestItem(event.point, "text") ? "pointer" : that.svgCursor(that.toolIcon, that.toolProps.size, that.toolColor))
        },
        onMouseUp: event => {
          const item = that.getHitTestItem(event.point, "text")
          const text = window.prompt("Enter text:", item ? item.data.text : "")
          const point = (item ? item.position : event.point).add(new Point(0, 5))
          const color = item ? item.data.color : that.toolColor
          if (text) {
            if (item) {
              item.remove()
            }
            const textItem = new PointText({
              point: point,
              content: text,
              justification: "center",
              fontFamily: "Roboto, Arial, sans-serif",
              fontSize: 16,
              fontWeight: "normal",
              strokeWidth: .2,
              shadowColor: "white",
              shadowBlur: 2,
              shadowOffset: 1,
            })
            that.pathGroup = new Group({
              children: [textItem],
              data: {
                tool: "text",
                text: text,
                color: that.toolColor,
              },
            })
            that.pathGroup.scale(that.scale)
            that.paintItem(that.pathGroup, color)
            that.saveState()
          }
        },
      },
    })

    // Shape tool.
    this.customTools.push({
      name: "shape",
      cursor: "crosshair",
      props: {
        onMouseDown: event => {
          that.pathGroup = new Group({data: {
            tool: "shape",
            shape: that.toolProps.shape,
            background: that.toolProps.background,
            opacity: that.toolProps.opacity,
            bordered: that.toolProps.bordered,
          }})

          // Place below other objects, just above the background item.
          if (that.toolProps.background) {
            that.pathGroup.insertAbove(that.project.activeLayer.children.background)
          }
        },
        onMouseDrag: event => {
          that.pathGroup.removeChildren()

          // Rectangle.
          if (that.toolProps.shape === "rectangle") {
            that.pathGroup.addChild(new Path.Rectangle({
              from: event.downPoint,
              to: event.point,
              fillColor: that.toolProps.bordered ? null : that.toolColor,
              opacity: that.toolProps.opacity || 1,
              strokeWidth: that.toolProps.bordered ? that.strokeWidth * that.scale : 0,
              strokeColor: that.toolProps.bordered ? that.toolColor : null,
            }))
          }

          // Circle.
          else if (that.toolProps.shape === "circle") {
            that.pathGroup.addChild(new Path.Circle({
              center: event.downPoint,
              radius: event.point.subtract(event.downPoint).length,
              fillColor: that.toolProps.bordered ? null : that.toolColor,
              opacity: that.toolProps.opacity || 1,
              strokeWidth: that.toolProps.bordered ? that.strokeWidth * that.scale : 0,
              strokeColor: that.toolProps.bordered ? that.toolColor : null,
            }))
          }

          // Triangle.
          else if (that.toolProps.shape === "triangle") {
            that.pathGroup.addChild(new Path.RegularPolygon({
              center: event.downPoint,
              sides: 3,
              radius: event.point.subtract(event.downPoint).length,
              fillColor: that.toolProps.bordered ? null : that.toolColor,
              opacity: that.toolProps.opacity || 1,
              strokeWidth: that.toolProps.bordered ? that.strokeWidth * that.scale : 0,
              strokeColor: that.toolProps.bordered ? that.toolColor : null,
            }))
          }
        },
        onMouseUp: event => {
          that.saveState()
        },
      },
    })

    // Paint tool.
    this.customTools.push({
      name: "paint",
      cursor: null,
      props: {
        onMouseMove: event => {
          that.view.element.style.setProperty("cursor", that.getHitTestItem(event.point) ? "pointer" : null)
        },
        onMouseUp: event => {
          const item = that.getHitTestItem(event.point)
          if (item) {
            that.paintItem(item)
            that.saveState()
          }
        },
      },
    })

    // Move tool.
    this.customTools.push({
      name: "move",
      cursor: null,
      props: {
        onMouseDown: event => {
          that.activeItem = that.getHitTestItem(event.point)
          that.activeItemOffset = that.activeItem ? that.activeItem.position.subtract(event.point) : null
        },
        onMouseMove: event => {
          that.view.element.style.setProperty("cursor", that.getHitTestItem(event.point) ? "grab" : null)
        },
        onMouseDrag: event => {
          if (that.activeItem) {
            that.view.element.style.setProperty("cursor", "grabbing")
            that.activeItem.position = event.point.add(that.activeItemOffset)
          }
        },
        onMouseUp: event => {
          that.activeItem = null
          that.view.element.style.setProperty("cursor", that.getHitTestItem(event.point) ? "grab" : null)
          that.saveState()
        },
      },
    })

    // Rotate tool.
    this.customTools.push({
      name: "rotate",
      cursor: null,
      props: {
        onMouseMove: event => {
          that.view.element.style.setProperty("cursor", that.getHitTestItem(event.point) ? "pointer" : null)
        },
        onMouseUp: event => {
          const item = that.getHitTestItem(event.point)
          if (item) {
            item.rotate(30)
            that.saveState()
          }
        },
      },
    })

    // Scale tool.
    this.customTools.push({
      name: "scale",
      cursor: null,
      props: {
        onMouseMove: event => {
          that.view.element.style.setProperty("cursor", that.getHitTestItem(event.point) ? "pointer" : null)
        },
        onMouseUp: event => {
          const item = that.getHitTestItem(event.point)
          if (item) {
            // Scale stroke only.
            if (that.toolProps.strokeOnly) {
              const strokeScaleOld = item.data.strokeScale || 1
              let strokeScaleNew = that.getNextSize([.67, 1, 1.5, 2, 2.5], strokeScaleOld)
              strokeScaleNew = Math.round((strokeScaleNew + Number.EPSILON) * 100) / 100
              if (strokeScaleNew !== strokeScaleOld) {
                item.data.strokeScale = strokeScaleNew
                item.children.forEach(child => {
                  if (child.strokeWidth && !child.data.skipStroke) {
                    child.strokeWidth = that.strokeWidth * strokeScaleNew * that.scale
                  }
                })
                that.saveState()
              }
            }

            // Scale entire item.
            else {
              const scaleOld = item.data.scale || item.data.resize || 1
              let scaleNew = that.getNextSize([.33, .66, 1, 1.33, 1.66, 2], scaleOld)
              scaleNew = Math.round((scaleNew + Number.EPSILON) * 100) / 100
              if (scaleNew !== scaleOld) {
                item.data.scale = scaleNew
                item.applyMatrix = false
                item.scale(scaleNew / scaleOld)
                that.saveState()
              }
            }
          }
        },
      },
    })

    // Erase tool
    this.customTools.push({
      name: "erase",
      cursor: null,
      props: {
        onMouseMove: event => {
          const hitResult = that.project.hitTest(event.point, {
            fill: true,
            stroke: true,
            tolerance: 5
          });
          that.view.element.style.setProperty("cursor", hitResult ? "pointer" : null);
        },
        onMouseDown: event => {
          const hitResult = that.project.hitTest(event.point, {
            fill: true,
            stroke: true,
            tolerance: 5
          });

          if (hitResult && hitResult.item) {
            // Get the top-level parent item
            let topItem = hitResult.item;
            while (topItem.parent && !(topItem.parent instanceof Layer)) {
              topItem = topItem.parent;
            }
            
            // Force remove the item and its children
            if (topItem.parent) {
              topItem.parent.removeChildren(topItem.index, topItem.index + 1);
            }
            topItem.remove();
            
            // Save state immediately
            that.saveState();
          }
        }
      }
    });

    // Copy tool
    this.customTools.push({
      name: "copy",
      cursor: "copy",
      props: {
        onMouseDown: event => {
          const hitResult = that.project.hitTest(event.point, {
            fill: true,
            stroke: true,
            tolerance: 5
          });

          if (hitResult && hitResult.item) {
            // Get the top-level parent item
            let topItem = hitResult.item;
            while (topItem.parent && !(topItem.parent instanceof Layer)) {
              topItem = topItem.parent;
            }
            
            // Store a completely new copy
            const cleanCopy = topItem.clone({ insert: false });  // Don't insert into project
            cleanCopy.data = { ...topItem.data, isClone: true };  // Mark as a clone
            that.copiedItems = [cleanCopy];
            
            // Visual feedback
            const feedback = topItem.clone();
            feedback.opacity = 0.5;
            setTimeout(() => feedback.remove(), 300);
          }
        }
      }
    });

    // Paste tool
    this.customTools.push({
      name: "paste",
      cursor: "pointer",
      props: {
        onMouseDown: event => {
          if (that.copiedItems && that.copiedItems.length > 0) {
            const group = new Group();
            
            that.copiedItems.forEach(item => {
              const pastedItem = item.clone();
              pastedItem.position = event.point;
              pastedItem.data = { ...item.data, isPasted: true };  // Mark as pasted
              group.addChild(pastedItem);
            });
            
            that.pathGroup = group;
            that.paintItem(that.pathGroup);
            that.saveState();
          }
        }
      }
    });
  }

}

export default Canvas
