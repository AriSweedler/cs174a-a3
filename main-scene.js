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
      axis:  new Axis_Arrows()
    }
    shapes.box_2.texture_coords = shapes.box_2.texture_coords.map( v => Vec.of(v[0]*2, v[1]*2) );
    this.submit_shapes( context, shapes );

    /* TODO:  Create the materials required to texture both cubes with the
     * correct images and settings. Make each Material from the correct shader.
     * Phong_Shader will work initially, but when you get to requirements 6 and
     * 7 you will need different ones.*/
    this.materials = {
      phong: context.get_instance( Phong_Shader ).material( Color.of( 1,1,0,1 ) ),
      box_1: context.get_instance( Texture_Rotate ).material( Color.of( 0,0,0,1 ), {ambient: 1, specularity: 0, texture: context.get_instance( "assets/cap.png", false )} ),
      box_2: context.get_instance( Texture_Scroll_X  ).material( Color.of( 0,0,0,1 ), {ambient: 1, specularity: 0, texture: context.get_instance( "assets/iron.png", true )} ),
    };

    this.lights = [ new Light( Vec.of( -5,5,5,1 ), Color.of( 0,1,1,1 ), 100000 ) ];

    /* TODO:  Create any variables that needs to be remembered from frame to
     * frame, such as for incremental movements over time. */
     this.cube_rotation = true;
     this.box_1 = {
       transform: Mat4.identity().times( Mat4.translation([-2, 0, -5]) ),
       rpm: 30,
       rad: (dt) => this.cube_rotation ? 2*Math.PI*dt*(this.box_1.rpm/60) : 0,
     };
     this.box_2 = {
       transform: Mat4.identity().times( Mat4.translation([2, 0, -5]) ),
       rpm: 20,
       rad: (dt) => this.cube_rotation ? 2*Math.PI*dt*(this.box_2.rpm/60) : 0,
     };
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
      .times( Mat4.rotation(this.box_1.rad(dt), xAxis) );
    this.shapes.box_1.draw( graphics_state, this.box_1.transform, this.materials.box_1 );

    /* box_2 */
    this.box_2.transform = this.box_2.transform
      .times( Mat4.rotation(this.box_2.rad(dt), yAxis) );
    this.shapes.box_2.draw( graphics_state, this.box_2.transform, this.materials.box_2 );
  }
}

class Texture_Scroll_X extends Phong_Shader
{
  /* ********** FRAGMENT SHADER ********* */
  fragment_glsl_code()
  {
    /* TODO:  Modify the shader below (right now it's just the same fragment
     * shader as Phong_Shader) for requirement #6. */
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
    /* TODO:  Modify the shader below (right now it's just the same fragment
     * shader as Phong_Shader) for requirement #7. */
    return `
      uniform sampler2D texture;
      void main()
      { if( GOURAUD || COLOR_NORMALS )    // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
        { gl_FragColor = VERTEX_COLOR;    // Otherwise, we already have final colors to smear (interpolate) across vertices.
          return;
        }                                 // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                                          // Phong shading is not to be confused with the Phong Reflection Model.
        vec4 tex_color = texture2D( texture, f_tex_coord );                         // Sample the texture image in the correct place.
                                                                                    // Compute an initial (ambient) color:
        if( USE_TEXTURE ) gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w );
        else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
        gl_FragColor.xyz += phong_model_lights( N );                     // Compute the final color with contributions from lights.
      }`;
  }
}
