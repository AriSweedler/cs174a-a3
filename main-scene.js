const xAxis = Vec.of( 1,0,0 );
const yAxis = Vec.of( 0,1,0 );

window.Assignment_Three_Scene = window.classes.Assignment_Three_Scene = class Assignment_Three_Scene extends Scene_Component
{
  constructor( context, control_box )
  {
    super(   context, control_box );
    if( !context.globals.has_controls   ) {
      context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) );
    }

    context.globals.graphics_state.camera_transform = Mat4.look_at( Vec.of( 0,0,5 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) );

    const r = context.width/context.height;
    context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/4, r, .1, 1000 );

    const shapes = {
      box_1:   new Cube(),
      box_2: new Cube(),
      extra_credit: new MyShape(),
      axis:  new Axis_Arrows()
    }
    shapes.box_2.texture_coords = shapes.box_2.texture_coords.map( v => Vec.of(v[0]*2, v[1]*2) );
    this.submit_shapes( context, shapes );

    this.materials = {
      phong: context.get_instance( Phong_Shader ).material( Color.of( 1,1,0,1 ) ),
      box_1: context.get_instance( Texture_Rotate ).material( Color.of( 0,0,0,1 ), {ambient: 1, /*specularity: 0,*/ texture: context.get_instance( "assets/cap.png", false )} ),
      box_2: context.get_instance( Texture_Scroll_X  ).material( Color.of( 0,0,0,1 ), {ambient: 1, /*specularity: 0,*/ texture: context.get_instance( "assets/iron.png", true )} ),
      extra_credit: context.get_instance( Phong_Shader ).material( Color.of( 1,1,0,1 ) ),
    };

    this.lights = [ new Light( Vec.of( -5,5,5,1 ), Color.of( 0,1,1,1 ), 100000 ) ];

    /* rotate an additional rpm rotation every 1000*60 units of dt */
    this.add_rad = (dt, rpm) => this.cube_rotation ? 2*Math.PI*dt*(rpm/60) : 0,

     this.cube_rotation = false;
     this.box_1 = { transform: Mat4.identity().times( Mat4.translation([-2, 0, 0]) ) };
     this.box_2 = { transform: Mat4.identity().times( Mat4.translation([2, 0, 0]) ) };
     this.extra_credit = { transform: Mat4.identity().times( Mat4.translation([0, -2, 0]) ) };
  }

  make_control_panel()
  {
    this.key_triggered_button( "Cube rotation",  [ "c" ], () => this.cube_rotation = !this.cube_rotation );
    this.new_line();
  }

  display( graphics_state )
  {
    /* Use the lights stored in this.lights. */
    graphics_state.lights = this.lights;
    const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;

    /* box_1 */
    this.box_1.transform = this.box_1.transform
      .times( Mat4.rotation(this.add_rad(dt, 30), xAxis) );
    this.shapes.box_1.draw( graphics_state, this.box_1.transform, this.materials.box_1 );

    /* box_2 */
    this.box_2.transform = this.box_2.transform
      .times( Mat4.rotation(this.add_rad(dt, 20), yAxis) );
    this.shapes.box_2.draw( graphics_state, this.box_2.transform, this.materials.box_2 );

    /* extra_credit */
    this.extra_credit.translation = this.extra_credit.translation;
    this.shapes.extra_credit.draw( graphics_state, this.extra_credit.transform, this.materials.extra_credit );
  }
}

class Texture_Scroll_X extends Phong_Shader
{
  /* ********** FRAGMENT SHADER ********* */
  fragment_glsl_code()
  {
    /* Do smooth "Phong" shading unless options like "Gouraud mode" are wanted
     * instead. Otherwise, we already have final colors to smear (interpolate)
     * across vertices.*/
    return `
      uniform sampler2D texture;
      void main()
      {
        if( GOURAUD || COLOR_NORMALS ) {
          gl_FragColor = VERTEX_COLOR;
          return;
        }
        /* If we get this far, calculate Smooth "Phong" Shading as opposed to
         * Gouraud Shading. Phong shading is not to be confused with the Phong
         * Reflection Model. */

        /* Sample the texture image in the correct place. Compute an initial
         * (ambient) color: */
        /* move the texture left by 2 texture units per second. Use
         * animation_time. Don't let tex_color.x get too big, cuz floats lose
         * precision away from 0.0 */
        vec4 tex_color = texture2D( texture, vec2(f_tex_coord.x+(mod(animation_time, 8.0)*2.0), f_tex_coord.y) );

        if ( USE_TEXTURE ) {
          gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w );
        } else {
          gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
        }

        /* Compute the final color with contributions from lights. */
        gl_FragColor.xyz += phong_model_lights( N );
      }`;
  }
}

class Texture_Rotate extends Phong_Shader
{
  /* ********* FRAGMENT SHADER ********* */
  fragment_glsl_code()
  {
    /* Do smooth "Phong" shading unless options like "Gouraud mode" are wanted
     * instead. Otherwise, we already have final colors to smear (interpolate)
     * across vertices.*/
    return `
      uniform sampler2D texture;
      void main()
      {
        if( GOURAUD || COLOR_NORMALS ) {
          gl_FragColor = VERTEX_COLOR;
          return;
        }
        /* If we get this far, calculate Smooth "Phong" Shading as opposed to
         * Gouraud Shading. Phong shading is not to be confused with the Phong
         * Reflection Model. */

        /* Sample the texture image in the correct place. Compute an initial
         * (ambient) color: */
        /* Rotate the texture map itself on all faces of cube #1 around the
         * center of each face at a rate of 15 rpm. Use animation_time. Don't
         * let tex_color.x get too big, cuz floats lose precision away from 0.0
         * */
         /*
            x = xcost - ysint
            y = ysint + xcost
         */

        /* 2D rotation matrix given in column major order */
        float rpm = 15.0;
        float tau = 3.14159*2.0;
        float percent = animation_time*(rpm/60.0);
        float theta = tau * mod(percent, 1.0);
        mat2 r = mat2( cos(theta), sin(theta), -sin(theta), cos(theta) );
        float t =  0.5;
        vec4 tex_color = texture2D( texture, r*(f_tex_coord.xy-t)+t );

        if ( USE_TEXTURE ) {
          gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w );
        } else {
          gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
        }

        /* Compute the final color with contributions from lights. */
        gl_FragColor.xyz += phong_model_lights( N );
      }`;
  }
}

window.MyShape = window.classes.MyShape = class MyShape extends Shape
{
  constructor()
  {
    super( "positions", "normals", "texture_coords" );
    let down = 0.7;

    let scaleMat = Mat4.scale([down, down, down]);
    for( var i = -1; i <= 1; i++ ) {
      for( var j = -1; j <= 1; j++ ) {
        for( var k = -1; k <= 1; k++ ) {
          let cube_transform = Mat4.identity().times( Mat4.scale( [0.3, 0.3, 0.3] ) );
          for( var c = 0; c < 6; c++ ) {
            cube_transform = cube_transform
              .times( scaleMat )
              .times( Mat4.translation([1.5*i, 1.5*j, 1.9*k]) );
            Cube.insert_transformed_copy_into( this, ["positions", "normals", "texture_coords"], cube_transform );
          }
        }
      }
    }
  }
}
