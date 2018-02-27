include(ExternalProject)

set(EXTERNAL_NAME tensorFlow)

string(TOUPPER ${EXTERNAL_NAME} EXTERNAL_NAME_UPPER)

set(TENSOR_URL "http://localhost:8001/TensorFlowHifi.zip")
set(TENSOR_URL_MD5 "6a4baeb5c2e61701ff19dd467c5e726b")

ExternalProject_Add(${EXTERNAL_NAME}
                    URL ${TENSOR_URL}
                    URL_MD5 ${TENSOR_URL_MD5}
                    CONFIGURE_COMMAND ""
                    BUILD_COMMAND ""
                    INSTALL_COMMAND ""
                    LOG_DOWNLOAD 1)

ExternalProject_Get_Property(${EXTERNAL_NAME} SOURCE_DIR)

set_target_properties(${EXTERNAL_NAME} PROPERTIES FOLDER "hidden/externals")

# set include dir
if(WIN32)
    set(${EXTERNAL_NAME_UPPER}_INCLUDE_DIRS "${SOURCE_DIR}/TensorFlowHifi_Windows/include" CACHE TYPE INTERNAL)
elseif(APPLE)
    set(${EXTERNAL_NAME_UPPER}_INCLUDE_DIRS "${SOURCE_DIR}/TensorFlowHifi_Mac/include" CACHE TYPE INTERNAL)
else()
    # Unsupported
endif()

if(WIN32)

    if("${CMAKE_SIZEOF_VOID_P}" EQUAL "8")
        set(ARCH_DIR "x64")
    else()
        set(ARCH_DIR "x86")
    endif()

    set(${EXTERNAL_NAME_UPPER}_LIB_PATH "${SOURCE_DIR}/TensorFlowHifi_Windows/lib/${ARCH_DIR}")
    set(${EXTERNAL_NAME_UPPER}_LIBRARY_RELEASE "${${EXTERNAL_NAME_UPPER}_LIB_PATH}/TensorFlowHifi.lib" CACHE TYPE INTERNAL)
    set(${EXTERNAL_NAME_UPPER}_LIBRARIES "${${EXTERNAL_NAME_UPPER}_LIB_PATH}/TensorFlowHifi.lib" CACHE TYPE INTERNAL)

    add_paths_to_fixup_libs("${${EXTERNAL_NAME_UPPER}_LIB_PATH}")

elseif(APPLE)

    set(${EXTERNAL_NAME_UPPER}_LIB_PATH "${SOURCE_DIR}/TensorFlowHifi_Mac/dylib")
    set(${EXTERNAL_NAME_UPPER}_LIBRARY_RELEASE "${${EXTERNAL_NAME_UPPER}_LIB_PATH}/TensorFlowHifi.dylib" CACHE TYPE INTERNAL)
    set(${EXTERNAL_NAME_UPPER}_LIBRARIES "${${EXTERNAL_NAME_UPPER}_LIB_PATH}/TensorFlowHifi.dylib" CACHE TYPE INTERNAL)

    add_paths_to_fixup_libs("${${EXTERNAL_NAME_UPPER}_LIB_PATH}")

else()
    # UNSUPPORTED
endif()

