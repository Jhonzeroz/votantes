<?php
// Configuración de la base de datos
 $host = 'server13.vps.webdock.cloud';
 $dbname = 'votacion_db';
 $username = 'thank';
 $password = '1541100Luis';

// Habilitar reporte de errores para depuración
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Cabecera para respuesta JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar solicitud OPTIONS para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Conexión a la base de datos con MySQLi
    $conn = new mysqli($host, $username, $password, $dbname);
    
    // Verificar conexión
    if ($conn->connect_error) {
        throw new Exception("Error de conexión: " . $conn->connect_error);
    }
    
    // Obtener datos del formulario (JSON)
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    // Validar datos requeridos
    if (empty($data['nombre_usuario']) || empty($data['apellido_usuario']) || 
        empty($data['telefono_usuario']) || empty($data['rol_usuario']) || 
        !isset($data['estado_usuario']) || empty($data['zona_asignada']) || 
        empty($data['contrasena_usuario'])) {
        
        echo json_encode([
            'success' => false,
            'message' => 'Todos los campos son obligatorios, incluyendo la contraseña'
        ]);
        exit();
    }
    
    // ===== NUEVA VALIDACIÓN: Verificar si el correo ya existe =====
    // Solo verificamos si se proporcionó un correo
    if (!empty($data['correo_usuario'])) {
        $check_sql = "SELECT ID_USUARIO FROM USUARIO_SISTEMA WHERE LOWER(correo) = LOWER(?)";
        $check_stmt = $conn->prepare($check_sql);
        
        if ($check_stmt === false) {
            throw new Exception("Error al preparar consulta de verificación de correo: " . $conn->error);
        }
        
        $check_stmt->bind_param("s", $data['correo_usuario']);
        $check_stmt->execute();
        $check_stmt->store_result();
        
        if ($check_stmt->num_rows > 0) {
            // Si el correo ya existe, devolvemos un error
            http_response_code(409); // 409 Conflict es el código apropiado para este caso
            echo json_encode([
                'success' => false,
                'message' => 'El correo electrónico ya está registrado.'
            ]);
            $check_stmt->close();
            $conn->close();
            exit();
        }
        $check_stmt->close();
    }
    
    // Si pasamos la validación, continuamos con el proceso...
    
    // Hashear contraseña
    $hashed_password = password_hash($data['contrasena_usuario'], PASSWORD_BCRYPT);
    
    // Preparar consulta SQL para insertar usuario
    $sql = "INSERT INTO USUARIO_SISTEMA (NOMBRE_USUARIO, APELLIDO_USUARIO, TELEFONO_USUARIO, ROL_USUARIO, ESTADO_USUARIO, ZONA_ASIGNADA, correo, password) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    
    // Preparar y ejecutar la consulta
    $stmt = $conn->prepare($sql);
    
    if ($stmt === false) {
        throw new Exception("Error al preparar consulta: " . $conn->error);
    }
    
    // Bind parameters
    $stmt->bind_param("ssssisss", 
        $data['nombre_usuario'], 
        $data['apellido_usuario'], 
        $data['telefono_usuario'], 
        $data['rol_usuario'], 
        $data['estado_usuario'], 
        $data['zona_asignada'],
        $data['correo_usuario'],
        $hashed_password
    );
    
    // Ejecutar la consulta
    $result = $stmt->execute();
    
    if ($result === false) {
        throw new Exception("Error al ejecutar consulta: " . $stmt->error);
    }
    
    // Obtener el ID del usuario insertado
    $id_usuario = $conn->insert_id;
    
    // Cerrar statement
    $stmt->close();
    
    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'message' => 'Usuario guardado correctamente',
        'id_usuario' => $id_usuario
    ]);
    
} catch(Exception $e) {
    // Error en la conexión o consulta
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

// Cerrar conexión
if (isset($conn)) {
    $conn->close();
}
?>