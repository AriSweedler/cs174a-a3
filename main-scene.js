
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
      box:   new Cube(),
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
      pic_cap: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), {ambient: 1, specularity: 0, texture: context.get_instance( "assets/cap.png", false )} ),
      pic_iron: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ), {ambient: 1, specularity: 0, texture: context.get_instance( "assets/iron.png", true )} ),
    };

    this.lights = [ new Light( Vec.of( -5,5,5,1 ), Color.of( 0,1,1,1 ), 100000 ) ];

    /* TODO:  Create any variables that needs to be remembered from frame to
     * frame, such as for incremental movements over time. */
     this.box = {};
     this.box_2 = {};
  }

  make_control_panel()
  {
    /* TODO:  Implement requirement #5 using a key_triggered_button that responds
     * to the 'c' key. */
  }

  display( graphics_state )
  {
    /* Use the lights stored in this.lights. */
    graphics_state.lights = this.lights;
    const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;

    /* box 1 */
    this.box.transform = Mat4.identity()
      .times( Mat4.translation([-2, 0, -5]) );
    this.shapes.box.draw( graphics_state, this.box.transform, this.materials.pic_cap );

    /* box 2 */
    this.box_2.transform = Mat4.identity()
      .times( Mat4.translation([2, 0, -5]) );
    this.shapes.box_2.draw( graphics_state, this.box_2.transform, this.materials.pic_iron );
  }
}

class Texture_Scroll_X extends Phong_Shader
{
  /* ********** FRAGMENT SHADER ********* */
  fragment_glsl_code()
  {
      /* TODO:  Modify the shader below (right now it's just the same fragment
       * shader as Phong_Shader) for requirement #6. */
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
