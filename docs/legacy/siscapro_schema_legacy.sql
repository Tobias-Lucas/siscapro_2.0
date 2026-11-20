-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Tempo de geração: 03/11/2026 às 17:29
-- Versão do servidor: 10.11.19-MariaDB-cll-lve
-- Versão do PHP: 8.4.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `sisc1207_siscapro`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `alunos`
--

CREATE TABLE `alunos` (
  `alu_id` int(10) NOT NULL,
  `alu_nome` varchar(150) DEFAULT NULL,
  `alu_nome_civil` varchar(150) DEFAULT NULL,
  `alu_nome_social` varchar(150) DEFAULT NULL,
  `alu_id_cad_ead` int(10) NOT NULL,
  `alu_cad_ava` int(1) NOT NULL DEFAULT 0,
  `alu_id_empresa` varchar(200) DEFAULT NULL,
  `alu_cpf` varchar(14) DEFAULT NULL,
  `alu_rg` varchar(30) DEFAULT NULL,
  `alu_bolsa` int(1) DEFAULT NULL,
  `alu_ctps` varchar(20) DEFAULT NULL,
  `alu_modalidade` varchar(10) NOT NULL,
  `alu_orig_cpf` varchar(30) DEFAULT NULL,
  `alu_foto` varchar(80) DEFAULT NULL,
  `alu_nascto` date DEFAULT NULL,
  `alu_estado_civil` int(1) DEFAULT NULL,
  `alu_idade` int(2) DEFAULT NULL,
  `alu_escolaridade` varchar(80) DEFAULT NULL,
  `alu_curso_infor` varchar(50) DEFAULT NULL,
  `alu_disp_horario` varchar(50) DEFAULT NULL,
  `alu_username` varchar(15) DEFAULT NULL,
  `alu_senha` varchar(32) DEFAULT NULL,
  `alu_sexo` varchar(15) DEFAULT NULL,
  `alu_end` varchar(100) DEFAULT NULL,
  `alu_nr_casa` varchar(10) DEFAULT NULL,
  `alu_cep` int(10) DEFAULT NULL,
  `alu_ibge` int(10) DEFAULT NULL,
  `alu_complemento` varchar(100) DEFAULT NULL,
  `alu_bairro` varchar(40) DEFAULT NULL,
  `alu_cidade` varchar(50) DEFAULT NULL,
  `alu_uf` varchar(2) DEFAULT NULL,
  `alu_curso` varchar(100) DEFAULT NULL,
  `alu_pai` varchar(100) DEFAULT NULL,
  `alu_mae` varchar(100) DEFAULT NULL,
  `alu_fone_pai` varchar(13) DEFAULT NULL,
  `alu_fone_mae` varchar(13) DEFAULT NULL,
  `alu_email_pai` varchar(80) DEFAULT NULL,
  `alu_email_mae` varchar(80) DEFAULT NULL,
  `alu_resp_legal` varchar(80) DEFAULT NULL,
  `alu_cpf_resp_legal` varchar(14) DEFAULT NULL,
  `alu_rg_resp_legal` varchar(20) DEFAULT NULL,
  `alu_email_resp_legal` varchar(100) DEFAULT NULL,
  `alu_tel1` char(15) DEFAULT NULL,
  `alu_tel2` char(15) DEFAULT NULL,
  `alu_tel3` char(15) DEFAULT NULL,
  `alu_tel4` char(12) DEFAULT NULL,
  `alu_email` varchar(100) DEFAULT NULL,
  `alu_instagram` varchar(60) DEFAULT NULL,
  `alu_facebook` varchar(60) DEFAULT NULL,
  `alu_banco` int(5) DEFAULT NULL,
  `alu_agencia` varchar(10) DEFAULT NULL,
  `alu_tipo_conta` int(1) DEFAULT NULL,
  `alu_c_c` varchar(15) DEFAULT NULL,
  `alu_operacao` varchar(5) DEFAULT NULL,
  `alu_pix` int(1) DEFAULT NULL,
  `alu_chave_pix` varchar(255) DEFAULT NULL,
  `alu_auto_dec_raca_etnia` varchar(8) DEFAULT NULL,
  `alu_dt_aviso_doc` date DEFAULT NULL,
  `alu_meio_ingresso` int(11) DEFAULT NULL,
  `alu_ingresso_web` int(1) DEFAULT NULL COMMENT 'apenas usuarios que fizeram cad pela web',
  `alu_nome_tecnico` varchar(60) DEFAULT NULL,
  `alu_contato_tecnico` varchar(13) DEFAULT NULL,
  `alu_status` int(1) NOT NULL DEFAULT 1,
  `alu_dt_cadastro` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'DATA ATUALIZACAO',
  `alu_usu_appa_update` varchar(30) NOT NULL,
  `alu_usu_appa_cad` varchar(30) NOT NULL,
  `alu_data_inscricao` date DEFAULT NULL COMMENT 'data cadastro efetivo '
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `alunos_pre_cad_periodo`
--

CREATE TABLE `alunos_pre_cad_periodo` (
  `apcp_id` int(11) NOT NULL,
  `apcp_periodo` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `alunos_pre_cad_turno`
--

CREATE TABLE `alunos_pre_cad_turno` (
  `apct_id` int(11) NOT NULL,
  `apct_turno` varchar(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_uca1400_ai_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `aluno_contrato`
--

CREATE TABLE `aluno_contrato` (
  `nome` varchar(200) NOT NULL,
  `cpf` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `analisa_doc`
--

CREATE TABLE `analisa_doc` (
  `ad_id` int(10) NOT NULL,
  `ad_id_aluno` int(10) NOT NULL,
  `ad_nr_doc` int(2) DEFAULT NULL,
  `ad_dt_vcto` date DEFAULT NULL,
  `ad_file` varchar(250) DEFAULT NULL,
  `ad_stt_doc` int(1) DEFAULT 3,
  `ad_motivo` varchar(60) DEFAULT NULL,
  `ad_cad_user` varchar(60) DEFAULT NULL,
  `ad_dt_cad` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `anexos_docs_cursos`
--

CREATE TABLE `anexos_docs_cursos` (
  `adc_id` int(10) NOT NULL,
  `adc_id_curso` int(10) NOT NULL,
  `adc_nome` varchar(200) NOT NULL,
  `adc_file` varchar(250) NOT NULL,
  `adc_usu_cad` varchar(60) NOT NULL,
  `adc_dt_cad` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `anexos_docs_ie`
--

CREATE TABLE `anexos_docs_ie` (
  `adie_id` int(10) NOT NULL,
  `adie_id_ie` int(10) NOT NULL,
  `adie_nome` varchar(200) NOT NULL,
  `adie_file` varchar(250) NOT NULL,
  `adie_usu_cad` varchar(60) NOT NULL,
  `adie_dt_cad` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `ano`
--

CREATE TABLE `ano` (
  `id` int(10) NOT NULL,
  `ano` int(4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `atendimento`
--

CREATE TABLE `atendimento` (
  `atd_id` int(10) NOT NULL,
  `atd_nome_aluno` varchar(100) NOT NULL,
  `atd_id_aluno` int(10) NOT NULL,
  `atd_id_empresa` int(10) NOT NULL,
  `atd_atendimento` longtext NOT NULL,
  `atd_anexo` varchar(250) DEFAULT NULL,
  `atd_usuario` varchar(40) NOT NULL,
  `atd_data_cad` datetime NOT NULL,
  `atd_setor` varchar(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `atendimento_emp`
--

CREATE TABLE `atendimento_emp` (
  `atd_emp_id` int(10) NOT NULL,
  `atd_emp_id_empresa` int(10) NOT NULL DEFAULT 0,
  `atd_emp_atendimento` longtext NOT NULL,
  `atd_emp_anexo` varchar(100) DEFAULT NULL,
  `atd_emp_usuario` varchar(40) NOT NULL,
  `atd_emp_data_cad` timestamp NULL DEFAULT NULL,
  `atd_emp_setor` varchar(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `atendimento_ie`
--

CREATE TABLE `atendimento_ie` (
  `atd_ie_id` int(10) NOT NULL,
  `atd_ie_id_ie` int(10) NOT NULL DEFAULT 0,
  `atd_ie_atendimento` longtext NOT NULL,
  `atd_ie_anexo` varchar(100) DEFAULT NULL,
  `atd_ie_usuario` varchar(40) NOT NULL,
  `atd_ie_data_cad` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `atendimento_notifica_emp`
--

CREATE TABLE `atendimento_notifica_emp` (
  `ane_id` int(10) NOT NULL,
  `ane_email_emp` varchar(100) NOT NULL,
  `ane_email_emp_resp_alu` varchar(100) NOT NULL,
  `ane_id_aluno` int(10) NOT NULL,
  `ane_nome_aluno` varchar(100) NOT NULL,
  `ane_id_atend` int(10) NOT NULL,
  `ane_dt_cad` timestamp NOT NULL DEFAULT current_timestamp(),
  `ane_user_cad` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `atendimento_setor`
--

CREATE TABLE `atendimento_setor` (
  `atd_str_id` int(10) NOT NULL,
  `atd_str_setor` varchar(50) NOT NULL,
  `atd_str_data_cad` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `aviso_falta_aluno`
--

CREATE TABLE `aviso_falta_aluno` (
  `afa_id` int(10) NOT NULL,
  `afa_id_aluno` int(10) DEFAULT NULL,
  `afa_id_curso` int(10) DEFAULT NULL,
  `afa_qtde_falta` varchar(3) DEFAULT NULL,
  `afa_dt_faltas` longtext DEFAULT NULL,
  `afa_email_pai` varchar(100) DEFAULT NULL,
  `afa_email_mae` varchar(100) DEFAULT NULL,
  `afa_email_resp` varchar(100) DEFAULT NULL,
  `afa_email_emp` varchar(100) DEFAULT NULL,
  `afa_dt_cad` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `bancos`
--

CREATE TABLE `bancos` (
  `id` int(5) NOT NULL,
  `b_id` varchar(5) DEFAULT NULL,
  `b_nome` varchar(40) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `banco_pix`
--

CREATE TABLE `banco_pix` (
  `p_id` int(2) NOT NULL,
  `p_chave` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `banco_tipo_contas`
--

CREATE TABLE `banco_tipo_contas` (
  `bt_id` int(2) NOT NULL,
  `bt_tipo` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `boletos_alunos`
--

CREATE TABLE `boletos_alunos` (
  `ba_id` int(10) NOT NULL,
  `ba_id_aluno` int(10) NOT NULL,
  `ba_id_empresa` int(10) NOT NULL,
  `ba_id_contrato` int(10) NOT NULL,
  `ba_arquivo` varchar(256) DEFAULT NULL,
  `ba_periodo_ini` date NOT NULL,
  `ba_periodo_fim` date NOT NULL,
  `ba_valor_unit` decimal(10,2) NOT NULL,
  `ba_data_cad` datetime NOT NULL,
  `ba_user_appa_cad` varchar(50) DEFAULT NULL,
  `ba_user_appa_up` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `boletos_nfs_empresas`
--

CREATE TABLE `boletos_nfs_empresas` (
  `bn_id` int(10) NOT NULL,
  `bn_arquivo` varchar(256) DEFAULT NULL,
  `bn_descricao` varchar(100) DEFAULT NULL,
  `bn_vcto` date NOT NULL,
  `bn_id_empresa` int(10) DEFAULT NULL,
  `bn_empresa` varchar(256) DEFAULT NULL,
  `bn_data_cad` timestamp NOT NULL DEFAULT current_timestamp(),
  `bn_user_appa_cad` varchar(50) DEFAULT NULL,
  `bn_user_appa_up` varchar(50) DEFAULT NULL,
  `bn_contador` int(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `cad_aluno_ead`
--

CREATE TABLE `cad_aluno_ead` (
  `cad_id` int(10) NOT NULL,
  `cad_nome` varchar(100) NOT NULL,
  `cad_curso` varchar(50) NOT NULL,
  `cad_empresa` varchar(250) NOT NULL,
  `cad_id_empresa` int(5) NOT NULL,
  `cad_cidade` varchar(50) NOT NULL,
  `cad_uf` varchar(2) DEFAULT NULL,
  `cad_dia_curso` varchar(50) NOT NULL,
  `cad_dia_retorno` varchar(20) NOT NULL,
  `cad_email` varchar(100) NOT NULL,
  `cad_dt_ini` varchar(10) NOT NULL,
  `cad_dt_fim` varchar(10) NOT NULL,
  `cad_status` varchar(20) DEFAULT NULL,
  `cad_data_cad` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `cad_edit_user` varchar(20) NOT NULL,
  `cad_cad_user` varchar(20) NOT NULL,
  `cad_obs` varchar(250) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `calendario_10_porcento`
--

CREATE TABLE `calendario_10_porcento` (
  `c10p_id` int(10) NOT NULL,
  `c10p_data_aula` date DEFAULT '0000-00-00',
  `c10p_id_ctt_alu` int(10) NOT NULL DEFAULT 0,
  `c10p_id_ctt_emp` int(10) NOT NULL DEFAULT 0,
  `c10p_id_aluno` int(10) NOT NULL,
  `c10p_id_curso` int(5) NOT NULL,
  `c10p_id_turma` int(5) NOT NULL,
  `c10_tipo_turma` varchar(5) NOT NULL,
  `c10p_id_emp` int(10) NOT NULL,
  `c10p_dt_cad` timestamp NOT NULL DEFAULT current_timestamp(),
  `c10p_usu_cad` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `candidato_habilidade`
--

CREATE TABLE `candidato_habilidade` (
  `ch_id` int(10) NOT NULL,
  `ch_habilidade` varchar(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `candidato_tipo_vaga`
--

CREATE TABLE `candidato_tipo_vaga` (
  `ctv_id` int(2) NOT NULL,
  `ctv_tipo` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `cbo_familia`
--

CREATE TABLE `cbo_familia` (
  `CODIGO` int(9) NOT NULL,
  `TITULO` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `cbo_ocupacao`
--

CREATE TABLE `cbo_ocupacao` (
  `CODIGO` varchar(6) DEFAULT NULL,
  `TITULO` varchar(99) DEFAULT NULL,
  `COL 3` varchar(49) DEFAULT NULL,
  `COL 4` varchar(43) DEFAULT NULL,
  `COL 5` varchar(23) DEFAULT NULL,
  `COL 6` varchar(28) DEFAULT NULL,
  `COL 7` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `cbo_perfil_ocupacional`
--

CREATE TABLE `cbo_perfil_ocupacional` (
  `COD_GRANDE_GRUPO` int(10) NOT NULL,
  `COD_SUBGRUPO_PRINCIPAL` int(10) NOT NULL,
  `COD_SUBGRUPO` int(10) NOT NULL,
  `COD_FAMILIA` int(10) NOT NULL,
  `COD_OCUPACAO` int(10) NOT NULL,
  `SGL_GRANDE_AREA` varchar(9) NOT NULL,
  `NOME_GRANDE_AREA` varchar(255) NOT NULL,
  `COD_ATIVIDADE` int(10) NOT NULL,
  `NOME_ATIVIDADE` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `certidoes_appa`
--

CREATE TABLE `certidoes_appa` (
  `cert_id` int(5) NOT NULL,
  `cert_id_tipo` int(10) NOT NULL,
  `cert_cod_validacao` varchar(255) DEFAULT NULL,
  `cert_dt_emissao` date NOT NULL,
  `cert_dt_validade` date NOT NULL,
  `cert_arquivo` varchar(255) NOT NULL,
  `cert_dt_cad` date NOT NULL,
  `cert_user_cad` varchar(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `certidoes_tipos`
--

CREATE TABLE `certidoes_tipos` (
  `cert_tipo_id` int(5) NOT NULL,
  `cert_tipo_nome` varchar(255) NOT NULL,
  `cert_tipo_url` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `chamado`
--

CREATE TABLE `chamado` (
  `c_id` varchar(5) NOT NULL,
  `id` int(11) NOT NULL,
  `c_id_unidade` int(2) NOT NULL,
  `c_assunto` varchar(80) NOT NULL,
  `c_prioridade` int(11) NOT NULL,
  `c_depto_destino` int(3) DEFAULT NULL,
  `c_user_destino` varchar(60) DEFAULT NULL,
  `c_depto_origem` varchar(3) DEFAULT NULL,
  `c_msg` longtext NOT NULL,
  `c_anexo1` varchar(255) DEFAULT NULL,
  `c_cham_fechado_por` varchar(60) DEFAULT NULL,
  `c_cham_fechado` datetime DEFAULT NULL,
  `c_dt_cad` datetime NOT NULL,
  `c_user_cad` varchar(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `chamado_interacoes`
--

CREATE TABLE `chamado_interacoes` (
  `ci_id` varchar(5) NOT NULL,
  `ci_id_controle` int(10) NOT NULL,
  `ci_msg` longtext NOT NULL,
  `ci_anexo1` varchar(255) DEFAULT NULL,
  `ci_status` varchar(60) DEFAULT NULL,
  `ci_user_cad` varchar(60) DEFAULT NULL,
  `ci_dt_cad` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `conhecimento_informatica`
--

CREATE TABLE `conhecimento_informatica` (
  `conh_inf_id` int(5) NOT NULL,
  `conh_conh` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `contrato_aluno`
--

CREATE TABLE `contrato_aluno` (
  `ctt_alu_id` int(10) NOT NULL,
  `ctt_alu_id_alu` int(10) NOT NULL,
  `ctt_id_curso` int(10) NOT NULL,
  `ctt_id_emp` int(10) DEFAULT NULL,
  `ctt_id_ie` int(10) DEFAULT NULL,
  `ctt_id_ctt_emp` int(10) DEFAULT 0,
  `ctt_id_segmento` int(10) NOT NULL,
  `ctt_alu_id_unidade` int(1) NOT NULL DEFAULT 0,
  `ctt_alu_id_horario` int(10) NOT NULL DEFAULT 0,
  `ctt_alu_bolsa` varchar(1) NOT NULL,
  `ctt_alu_perfil_contrato` varchar(10) DEFAULT NULL,
  `ctt_alu_id_preco_curso` int(5) DEFAULT NULL,
  `ctt_alu_valor_insalubridade` decimal(10,2) DEFAULT NULL,
  `ctt_alu_bolsa_oriunda` varchar(200) DEFAULT NULL,
  `ctt_alu_valor` decimal(10,2) DEFAULT 0.00,
  `ctt_alu_mod` varchar(3) NOT NULL,
  `ctt_alu_dt_ini` date DEFAULT NULL,
  `ctt_alu_dt_fim` date DEFAULT NULL,
  `ctt_alu_dt_ini2` date DEFAULT NULL,
  `ctt_alu_dt_fim2` date DEFAULT NULL,
  `ctt_alu_vcto_boleto` int(2) DEFAULT NULL,
  `ctt_alu_cobranca` int(1) NOT NULL DEFAULT 0,
  `ctt_alu_calend_pedag` varchar(250) DEFAULT 'nenhum',
  `ctt_alu_contrato` varchar(250) DEFAULT 'nenhum',
  `ctt_alu_aditivo` varchar(250) DEFAULT 'nenhum',
  `ctt_alu_cert_seg_estagio` varchar(250) NOT NULL DEFAULT 'nenhum',
  `ctt_alu_certificado` varchar(250) NOT NULL DEFAULT 'nenhum',
  `ctt_alu_dt_suspI` date DEFAULT NULL,
  `ctt_alu_dt_suspF` date DEFAULT NULL,
  `ctt_alu_susp_motivo` int(10) NOT NULL DEFAULT 0,
  `ctt_alu_canc_motivo` int(10) DEFAULT 0,
  `ctt_alu_red_ch` int(1) NOT NULL DEFAULT 0,
  `ctt_alu_ferias_apz` varchar(1) DEFAULT NULL,
  `ctt_alu_ferias_apz_ini` date DEFAULT NULL,
  `ctt_alu_ferias_apz_fim` date DEFAULT NULL,
  `ctt_alu_jornadaP` int(3) NOT NULL DEFAULT 0,
  `ctt_alu_jornadaT` int(3) NOT NULL DEFAULT 0,
  `ctt_alu_local_pratica` varchar(255) DEFAULT '0',
  `ctt_alu_local_teorica` int(3) NOT NULL DEFAULT 0,
  `ctt_alu_atividades` longtext NOT NULL DEFAULT '0',
  `ctt_alu_salario_tipo` int(1) NOT NULL DEFAULT 0,
  `ctt_alu_salario_extenso` varchar(255) DEFAULT NULL,
  `ctt_alu_salario_apdz` decimal(10,2) DEFAULT 0.00,
  `ctt_alu_estagio_obg` varchar(3) NOT NULL DEFAULT '0',
  `ctt_alu_resp_estagio_ie` varchar(250) DEFAULT NULL,
  `ctt_alu_resp_estagio_cargo_ie` varchar(200) DEFAULT NULL,
  `ctt_alu_id_sup_estagio_emp` int(10) DEFAULT NULL,
  `ctt_alu_resp_estagio_emp` varchar(200) DEFAULT NULL,
  `ctt_alu_resp_estagio_cargo_emp` varchar(200) DEFAULT NULL,
  `ctt_alu_estagio_nr_mat` varchar(30) DEFAULT NULL,
  `ctt_alu_estagio_curso` varchar(60) DEFAULT NULL,
  `ctt_alu_estagio_semestre` varchar(20) DEFAULT NULL,
  `ctt_alu_jornada_estagio` int(5) DEFAULT NULL,
  `ctt_alu_hr_ini_estagio` time DEFAULT NULL,
  `ctt_alu_hr_fim_estagio` time DEFAULT NULL,
  `ctt_alu_hr_ini_estagio2` time DEFAULT NULL,
  `ctt_alu_hr_fim_estagio2` time DEFAULT NULL,
  `ctt_alu_hr_ini_estagio_sab` time DEFAULT NULL,
  `ctt_alu_hr_fim_estagio_sab` time DEFAULT NULL,
  `ctt_alu_ch_diaria_estagio` varchar(5) DEFAULT NULL,
  `ctt_alu_ch_semana_estagio` varchar(5) DEFAULT NULL,
  `ctt_alu_aux_transp_estagio` decimal(10,2) DEFAULT NULL,
  `ctt_alu_aux_alimentacao` decimal(10,2) DEFAULT NULL,
  `ctt_alu_aux_transp_extenso` varchar(255) DEFAULT NULL,
  `ctt_alu_dias_estagio` int(2) DEFAULT NULL,
  `ctt_alu_seg_apolice` varchar(50) DEFAULT '0',
  `ctt_alu_seg_valor` decimal(10,2) DEFAULT 0.00,
  `ctt_alu_seg_valor_extenso` varchar(255) DEFAULT NULL,
  `ctt_alu_seg_id` int(10) DEFAULT 0,
  `ctt_alu_renova_tce` int(1) DEFAULT NULL,
  `ctt_alu_subst_local_vaga` varchar(100) DEFAULT NULL,
  `ctt_alu_subst_estagiario` varchar(100) DEFAULT NULL,
  `ctt_alu_subst_nr_sigadoc` varchar(100) DEFAULT NULL,
  `ctt_alu_contrat_direta` varchar(1) DEFAULT NULL,
  `ctt_alu_dt_desligamento` date DEFAULT NULL,
  `ctt_alu_dt_deslig_cad` datetime DEFAULT NULL,
  `ctt_dt_solicita_aditivo` date DEFAULT NULL,
  `ctt_alu_aditivo_dados` int(1) DEFAULT NULL,
  `ctt_alu_desligamento_emp` int(1) DEFAULT NULL,
  `ctt_alu_deslig_emp_requerente` varchar(80) DEFAULT NULL,
  `ctt_alu_deslig_emp_protocolo` varchar(100) DEFAULT NULL,
  `ctt_alu_dia_aula_preparatorio` varchar(20) DEFAULT NULL,
  `ctt_alu_producao` int(5) DEFAULT NULL COMMENT 'comissao por venda',
  `ctt_alu_dt_hr_contrato` datetime DEFAULT NULL COMMENT 'data e hora do cadastro do contrato no sistema',
  `ctt_alu_dt_cad` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `ctt_alu_cad_user` varchar(30) NOT NULL,
  `ctt_alu_edit_user` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `contrato_aluno_aditivo`
--

CREATE TABLE `contrato_aluno_aditivo` (
  `caa_id` int(10) NOT NULL,
  `caa_id_aluno` int(10) NOT NULL,
  `caa_id_ctt` int(10) NOT NULL,
  `caa_id_emp` int(10) NOT NULL,
  `caa_id_ie` int(10) DEFAULT NULL,
  `caa_id_curso` int(10) DEFAULT NULL,
  `caa_sup_estag_emp` int(10) DEFAULT NULL,
  `caa_resp_estag_ie` varchar(200) DEFAULT NULL,
  `caa_vigencia_ini` date DEFAULT NULL,
  `caa_vigencia_fim` date DEFAULT NULL,
  `caa_semestre` varchar(10) DEFAULT NULL,
  `caa_jornada` int(10) DEFAULT NULL,
  `caa_bolsa_aux` varchar(200) DEFAULT NULL,
  `caa_vt` varchar(200) DEFAULT NULL,
  `caa_unidade` int(1) DEFAULT NULL,
  `caa_user_cad` varchar(60) DEFAULT NULL,
  `caa_dt_cad` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `contrato_aluno_reducao_ch`
--

CREATE TABLE `contrato_aluno_reducao_ch` (
  `carch_id` int(10) NOT NULL,
  `carch_reducao` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `contrato_aluno_tst`
--

CREATE TABLE `contrato_aluno_tst` (
  `ctt_alu_id` int(10) NOT NULL,
  `ctt_alu_id_alu` int(10) NOT NULL,
  `ctt_id_curso` int(10) NOT NULL,
  `ctt_id_emp` int(10) DEFAULT NULL,
  `ctt_id_ie` int(10) DEFAULT NULL,
  `ctt_id_ctt_emp` int(10) DEFAULT 0,
  `ctt_id_segmento` int(10) NOT NULL,
  `ctt_alu_id_unidade` int(1) NOT NULL DEFAULT 0,
  `ctt_alu_id_horario` int(10) NOT NULL DEFAULT 0,
  `ctt_alu_bolsa` varchar(1) NOT NULL,
  `ctt_alu_perfil_contrato` varchar(10) DEFAULT NULL,
  `ctt_alu_id_preco_curso` int(5) DEFAULT NULL,
  `ctt_alu_valor_insalubridade` decimal(10,2) DEFAULT NULL,
  `ctt_alu_bolsa_oriunda` varchar(200) DEFAULT NULL,
  `ctt_alu_valor` decimal(10,2) DEFAULT 0.00,
  `ctt_alu_mod` varchar(3) NOT NULL,
  `ctt_alu_dt_ini` date DEFAULT NULL,
  `ctt_alu_dt_fim` date DEFAULT NULL,
  `ctt_alu_dt_ini2` date DEFAULT NULL,
  `ctt_alu_dt_fim2` date DEFAULT NULL,
  `ctt_alu_vcto_boleto` int(2) DEFAULT NULL,
  `ctt_alu_cobranca` int(1) NOT NULL DEFAULT 0,
  `ctt_alu_calend_pedag` varchar(250) DEFAULT 'nenhum',
  `ctt_alu_contrato` varchar(250) DEFAULT 'nenhum',
  `ctt_alu_aditivo` varchar(250) DEFAULT 'nenhum',
  `ctt_alu_cert_seg_estagio` varchar(250) NOT NULL DEFAULT 'nenhum',
  `ctt_alu_certificado` varchar(250) NOT NULL DEFAULT 'nenhum',
  `ctt_alu_dt_suspI` date DEFAULT NULL,
  `ctt_alu_dt_suspF` date DEFAULT NULL,
  `ctt_alu_susp_motivo` int(10) NOT NULL DEFAULT 0,
  `ctt_alu_canc_motivo` int(10) DEFAULT 0,
  `ctt_alu_red_ch` int(1) NOT NULL DEFAULT 0,
  `ctt_alu_ferias_apz` varchar(1) DEFAULT NULL,
  `ctt_alu_ferias_apz_ini` date DEFAULT NULL,
  `ctt_alu_ferias_apz_fim` date DEFAULT NULL,
  `ctt_alu_jornadaP` int(3) NOT NULL DEFAULT 0,
  `ctt_alu_jornadaT` int(3) NOT NULL DEFAULT 0,
  `ctt_alu_local_pratica` varchar(255) DEFAULT '0',
  `ctt_alu_local_teorica` int(3) NOT NULL DEFAULT 0,
  `ctt_alu_atividades` longtext NOT NULL DEFAULT '0',
  `ctt_alu_salario_tipo` int(1) NOT NULL DEFAULT 0,
  `ctt_alu_salario_extenso` varchar(255) DEFAULT NULL,
  `ctt_alu_salario_apdz` decimal(10,2) DEFAULT 0.00,
  `ctt_alu_estagio_obg` varchar(3) NOT NULL DEFAULT '0',
  `ctt_alu_resp_estagio_ie` varchar(250) DEFAULT NULL,
  `ctt_alu_resp_estagio_cargo_ie` varchar(200) DEFAULT NULL,
  `ctt_alu_id_sup_estagio_emp` int(10) DEFAULT NULL,
  `ctt_alu_resp_estagio_emp` varchar(200) DEFAULT NULL,
  `ctt_alu_resp_estagio_cargo_emp` varchar(200) DEFAULT NULL,
  `ctt_alu_estagio_nr_mat` varchar(30) DEFAULT NULL,
  `ctt_alu_estagio_curso` varchar(60) DEFAULT NULL,
  `ctt_alu_estagio_semestre` varchar(20) DEFAULT NULL,
  `ctt_alu_jornada_estagio` int(5) DEFAULT NULL,
  `ctt_alu_hr_ini_estagio` time DEFAULT NULL,
  `ctt_alu_hr_fim_estagio` time DEFAULT NULL,
  `ctt_alu_hr_ini_estagio2` time DEFAULT NULL,
  `ctt_alu_hr_fim_estagio2` time DEFAULT NULL,
  `ctt_alu_hr_ini_estagio_sab` time DEFAULT NULL,
  `ctt_alu_hr_fim_estagio_sab` time DEFAULT NULL,
  `ctt_alu_ch_diaria_estagio` varchar(5) DEFAULT NULL,
  `ctt_alu_ch_semana_estagio` varchar(5) DEFAULT NULL,
  `ctt_alu_aux_transp_estagio` decimal(10,2) DEFAULT NULL,
  `ctt_alu_aux_alimentacao` decimal(10,2) DEFAULT NULL,
  `ctt_alu_aux_transp_extenso` varchar(255) DEFAULT NULL,
  `ctt_alu_dias_estagio` int(2) DEFAULT NULL,
  `ctt_alu_seg_apolice` varchar(50) DEFAULT '0',
  `ctt_alu_seg_valor` decimal(10,2) DEFAULT 0.00,
  `ctt_alu_seg_valor_extenso` varchar(255) DEFAULT NULL,
  `ctt_alu_seg_id` int(10) DEFAULT 0,
  `ctt_alu_renova_tce` int(1) DEFAULT NULL,
  `ctt_alu_subst_local_vaga` varchar(100) DEFAULT NULL,
  `ctt_alu_subst_estagiario` varchar(100) DEFAULT NULL,
  `ctt_alu_subst_nr_sigadoc` varchar(100) DEFAULT NULL,
  `ctt_alu_contrat_direta` varchar(1) DEFAULT NULL,
  `ctt_alu_dt_desligamento` date DEFAULT NULL,
  `ctt_alu_dt_deslig_cad` datetime DEFAULT NULL,
  `ctt_dt_solicita_aditivo` date DEFAULT NULL,
  `ctt_alu_aditivo_dados` int(1) DEFAULT NULL,
  `ctt_alu_desligamento_emp` int(1) DEFAULT NULL,
  `ctt_alu_deslig_emp_requerente` varchar(80) DEFAULT NULL,
  `ctt_alu_deslig_emp_protocolo` varchar(100) DEFAULT NULL,
  `ctt_alu_dia_aula_preparatorio` varchar(20) DEFAULT NULL,
  `ctt_alu_dt_hr_contrato` datetime DEFAULT NULL,
  `ctt_alu_dt_cad` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `ctt_alu_cad_user` varchar(30) NOT NULL,
  `ctt_alu_edit_user` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `contrato_empresa`
--

CREATE TABLE `contrato_empresa` (
  `cte_id` int(10) NOT NULL,
  `cte_id_emp` int(10) DEFAULT NULL,
  `cte_id_seg` int(10) NOT NULL,
  `cte_id_unidade` int(1) DEFAULT NULL,
  `cte_indice_reajuste` varchar(26) DEFAULT NULL,
  `cte_valor` decimal(10,2) DEFAULT NULL,
  `cte_mod` varchar(7) NOT NULL,
  `cte_dt_ini` date NOT NULL,
  `cte_dt_fim` date DEFAULT NULL,
  `cte_dt_ini_reajuste` date DEFAULT NULL,
  `cte_dt_fim_reajuste` date DEFAULT NULL,
  `cte_id_ctt_venc_reajust` int(10) DEFAULT NULL,
  `cte_dt_indet` int(1) DEFAULT 0,
  `cte_pgto_prop_compet` varchar(12) DEFAULT NULL,
  `cte_motivo_cancel` int(10) DEFAULT 0,
  `cte_status` int(1) DEFAULT 1,
  `cte_vincula_servico` int(1) DEFAULT NULL,
  `cte_oculta_renew` int(1) NOT NULL DEFAULT 0,
  `cte_file` varchar(255) DEFAULT NULL,
  `cte_obs` longtext DEFAULT NULL,
  `dt_fim` int(1) NOT NULL DEFAULT 0,
  `cte_dt_cad` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `cte_cad_user` varchar(30) NOT NULL,
  `cte_edit_user` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `contrato_motivo_canc`
--

CREATE TABLE `contrato_motivo_canc` (
  `cmc_id` int(10) NOT NULL,
  `cmc_motivo` varchar(40) NOT NULL,
  `cmc_id_seg` int(10) NOT NULL,
  `cmc_via_cad` char(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `contrato_motivo_susp`
--

CREATE TABLE `contrato_motivo_susp` (
  `cms_id` int(10) NOT NULL,
  `cms_motivo` varchar(40) NOT NULL,
  `cms_id_seg` int(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `cron_status`
--

CREATE TABLE `cron_status` (
  `cs_id` int(10) NOT NULL,
  `cs_nome` varchar(200) NOT NULL,
  `cs_status` int(1) DEFAULT NULL,
  `cs_dt_reg` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `curso`
--

CREATE TABLE `curso` (
  `curso_id` int(11) NOT NULL,
  `curso_id_segmento` int(10) DEFAULT NULL,
  `curso_tipo_turma` varchar(6) NOT NULL,
  `curso_perfil_turma` int(1) DEFAULT NULL,
  `curso_mod` varchar(3) NOT NULL DEFAULT '0',
  `curso_id_curso` int(10) DEFAULT NULL,
  `curso_id_unidade` int(1) DEFAULT NULL,
  `curso_unidade` int(3) DEFAULT NULL,
  `curso_nome` varchar(200) NOT NULL,
  `curso_status` varchar(10) NOT NULL,
  `curso_data` timestamp NOT NULL DEFAULT current_timestamp(),
  `curso_user_appa` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `curso_appa`
--

CREATE TABLE `curso_appa` (
  `curappa_id` int(10) NOT NULL,
  `curappa_curso` varchar(200) NOT NULL,
  `curappa_sigla` varchar(10) DEFAULT NULL,
  `curappa_unidade` int(2) NOT NULL DEFAULT 0,
  `curappa_protocolo` varchar(30) NOT NULL DEFAULT '0',
  `curappa_mod` varchar(3) NOT NULL,
  `curappa_combo` varchar(1) NOT NULL DEFAULT '0',
  `curappa_segmento` int(2) DEFAULT NULL,
  `curappa_ch_total` varchar(5) DEFAULT NULL,
  `curappa_ch_atv_prat` varchar(5) DEFAULT NULL,
  `curappa_ch_atv_teor` varchar(5) DEFAULT NULL,
  `curappa_dt_ini` date DEFAULT NULL,
  `curappa_dt_fim` date DEFAULT NULL,
  `curappa_status` varchar(10) NOT NULL DEFAULT 'Ativo',
  `curappa_data_cad` timestamp NOT NULL DEFAULT current_timestamp(),
  `curappa_user_appa` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `curso_appa_cbo`
--

CREATE TABLE `curso_appa_cbo` (
  `cac_id` int(10) NOT NULL,
  `cac_id_curso` int(10) NOT NULL,
  `cac_cbo` int(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `curso_dias_aulas`
--

CREATE TABLE `curso_dias_aulas` (
  `cda_id` int(10) NOT NULL,
  `cda_id_curso` int(10) NOT NULL,
  `cda_id_horario` int(10) NOT NULL,
  `cda_dia_seg` int(1) NOT NULL,
  `cda_dia_ter` int(1) NOT NULL,
  `cda_dia_qua` int(1) NOT NULL,
  `cda_dia_qui` int(1) NOT NULL,
  `cda_dia_sex` int(1) NOT NULL,
  `cda_dia_sab` int(1) NOT NULL,
  `cda_parteTP` varchar(7) NOT NULL,
  `cda_unidade` varchar(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `curso_dia_hora_aula`
--

CREATE TABLE `curso_dia_hora_aula` (
  `cda_id` int(10) NOT NULL,
  `cda_id_curso` int(10) NOT NULL,
  `cda_hora_i` time NOT NULL,
  `cda_hora_f` time NOT NULL,
  `cda_hora_i2` time DEFAULT NULL,
  `cda_hora_f2` time DEFAULT NULL,
  `cda_turno` varchar(2) NOT NULL,
  `cda_dia_seg` int(1) NOT NULL,
  `cda_dia_ter` int(1) NOT NULL,
  `cda_dia_qua` int(1) NOT NULL,
  `cda_dia_qui` int(1) NOT NULL,
  `cda_dia_sex` int(1) NOT NULL,
  `cda_dia_sab` int(1) NOT NULL,
  `cda_parteTP` varchar(7) NOT NULL,
  `cda_retorno` int(10) NOT NULL,
  `cda_unidade` varchar(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `curso_dia_retorno`
--

CREATE TABLE `curso_dia_retorno` (
  `cdr_id` int(10) NOT NULL,
  `cdr_dia` varchar(15) NOT NULL,
  `cdr_semana` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `curso_horarios`
--

CREATE TABLE `curso_horarios` (
  `ch_id` int(10) NOT NULL,
  `ch_id_curso` int(10) NOT NULL,
  `ch_horaI` time NOT NULL,
  `ch_horaF` time NOT NULL,
  `ch_turno` varchar(15) NOT NULL,
  `ch_dias1_combo` varchar(100) DEFAULT NULL,
  `ch_curso1_combo` varchar(100) DEFAULT NULL,
  `ch_horaI_2` time DEFAULT NULL,
  `ch_horaF_2` time DEFAULT NULL,
  `ch_dias2_combo` varchar(100) DEFAULT NULL,
  `ch_curso2_combo` varchar(100) DEFAULT NULL,
  `ch_turno2` varchar(15) DEFAULT NULL,
  `ch_unidade` varchar(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `curso_segmento`
--

CREATE TABLE `curso_segmento` (
  `seg_id` int(10) NOT NULL,
  `seg_curso` varchar(40) NOT NULL,
  `seg_mod` varchar(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `dados_ava_covid19`
--

CREATE TABLE `dados_ava_covid19` (
  `dac_id` int(10) NOT NULL,
  `dac_id_aluno` int(10) NOT NULL,
  `dac_nome` varchar(100) NOT NULL,
  `dac_email` varchar(100) NOT NULL,
  `dac_email_emp1` varchar(100) DEFAULT NULL,
  `dac_curso` varchar(50) NOT NULL,
  `dac_user` varchar(20) NOT NULL,
  `dac_senha` varchar(20) NOT NULL,
  `dac_dt_cad` timestamp NOT NULL DEFAULT current_timestamp(),
  `dac_user_cad` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `data_aula`
--

CREATE TABLE `data_aula` (
  `da_id` int(10) NOT NULL,
  `da_mod` varchar(3) NOT NULL,
  `da_id_turma` int(10) DEFAULT NULL,
  `da_id_curso` int(10) DEFAULT NULL,
  `da_data_aula` date DEFAULT NULL,
  `da_user_cad` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `debito_carta_cob`
--

CREATE TABLE `debito_carta_cob` (
  `dcc_id` int(10) NOT NULL,
  `dcc_id_emp` int(10) DEFAULT NULL,
  `dcc_nr_aviso` int(1) DEFAULT NULL,
  `dcc_qtde_debito` int(3) DEFAULT NULL,
  `dcc_debito` longtext DEFAULT NULL,
  `dcc_notif_emp` int(1) DEFAULT NULL,
  `dcc_dt_cad` datetime DEFAULT NULL,
  `dcc_user_cad` varchar(60) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `debito_notif_extra_judicial`
--

CREATE TABLE `debito_notif_extra_judicial` (
  `dnej_id` int(10) NOT NULL,
  `dnej_qtde_debito` int(5) DEFAULT NULL,
  `dnej_notif_emp` int(1) DEFAULT NULL,
  `dnej_id_emp` int(10) DEFAULT NULL,
  `dnej_debito` longtext DEFAULT NULL,
  `dnej_dt_cad` datetime DEFAULT NULL,
  `dnej_user_cad` varchar(60) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `demandas_email`
--

CREATE TABLE `demandas_email` (
  `de_id` int(10) NOT NULL,
  `de_id_emp` int(10) DEFAULT NULL,
  `de_id_tipo_demanda` int(10) DEFAULT NULL,
  `de_resp_demanda` varchar(60) DEFAULT NULL,
  `de_remetente` varchar(80) DEFAULT NULL,
  `de_email` varchar(100) DEFAULT NULL,
  `de_assunto_email` varchar(250) DEFAULT NULL,
  `de_dt_hr_receb_email` datetime DEFAULT NULL,
  `de_evolucao` int(1) DEFAULT NULL,
  `de_status` int(1) NOT NULL DEFAULT 1,
  `de_dt_cad` datetime DEFAULT NULL,
  `de_user_cad` varchar(60) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `demandas_tarefas`
--

CREATE TABLE `demandas_tarefas` (
  `dt_id` int(10) NOT NULL,
  `dt_id_demanda` int(10) DEFAULT NULL,
  `dt_nome_aluno` varchar(80) DEFAULT NULL,
  `dt_dt_ini` date DEFAULT NULL,
  `dt_dt_prazo` date DEFAULT NULL,
  `dt_dt_final` date DEFAULT NULL,
  `dt_obs` longtext DEFAULT NULL,
  `dt_resp_appa` varchar(60) DEFAULT NULL,
  `dt_status` int(1) DEFAULT NULL,
  `dt_data_reg` date DEFAULT NULL COMMENT 'data que a tarefa foi concluida'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `demandas_tipo`
--

CREATE TABLE `demandas_tipo` (
  `dt_id` int(10) NOT NULL,
  `dt_demanda` varchar(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `diario_visitas`
--

CREATE TABLE `diario_visitas` (
  `dv_id` int(10) NOT NULL,
  `dv_id_undd` int(1) NOT NULL,
  `dv_meio_atend` int(1) DEFAULT NULL,
  `dv_nome` varchar(100) DEFAULT NULL,
  `dv_celular` varchar(15) DEFAULT NULL,
  `dv_email` varchar(100) DEFAULT NULL,
  `dv_assunto` varchar(200) DEFAULT NULL,
  `dv_dt_cad` datetime DEFAULT NULL,
  `dv_user_cad` varchar(60) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `dia_aula_ead`
--

CREATE TABLE `dia_aula_ead` (
  `dia_id` int(10) NOT NULL,
  `dia_dia` varchar(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `dia_aula_preparatorio`
--

CREATE TABLE `dia_aula_preparatorio` (
  `dap_id` int(10) NOT NULL,
  `dap_dia` varchar(60) NOT NULL,
  `dap_unidade` varchar(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `dia_retorno_aula_apdz`
--

CREATE TABLE `dia_retorno_aula_apdz` (
  `ret_id` int(10) NOT NULL,
  `ret_dia_horario` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `disciplinas`
--

CREATE TABLE `disciplinas` (
  `disc_id` int(10) NOT NULL,
  `disc_id_curso` int(10) DEFAULT NULL,
  `disc_id_prof` int(10) DEFAULT NULL,
  `disc_parte` varchar(4) DEFAULT NULL,
  `disc_disciplina` varchar(250) NOT NULL,
  `disc_mod_curso` varchar(50) NOT NULL,
  `disc_ch` varchar(5) DEFAULT NULL,
  `disc_periodo_ini` date DEFAULT NULL,
  `disc_periodo_fim` date DEFAULT NULL,
  `disc_status` varchar(20) NOT NULL DEFAULT 'Ativo',
  `disc_data_cad` timestamp NOT NULL DEFAULT current_timestamp(),
  `disc_user_appa` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `disciplinas_vinculos_prof`
--

CREATE TABLE `disciplinas_vinculos_prof` (
  `dvp_id` int(10) NOT NULL,
  `dvp_id_prof` int(10) NOT NULL,
  `dvp_id_curso` int(10) NOT NULL,
  `dvp_id_disc` int(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `disponibilidade_horario`
--

CREATE TABLE `disponibilidade_horario` (
  `disp_hor_id` int(5) NOT NULL,
  `disp_hor_disponib` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `empresas`
--

CREATE TABLE `empresas` (
  `emp_id` int(10) NOT NULL,
  `emp_id_resp_finan` int(10) DEFAULT NULL COMMENT 'empresa responsavel pelo pgto e adm dos contratados',
  `emp_modalidade` varchar(10) DEFAULT NULL,
  `emp_cnpj` varchar(18) NOT NULL,
  `emp_razao_social` varchar(200) NOT NULL,
  `emp_fantasia` varchar(100) DEFAULT NULL,
  `emp_terceirizada` int(1) NOT NULL DEFAULT 0,
  `emp_endereco` varchar(100) DEFAULT NULL,
  `emp_ender_alt` varchar(255) DEFAULT NULL,
  `emp_cep` int(10) DEFAULT NULL,
  `emp_nr_predio` varchar(10) DEFAULT NULL,
  `emp_complemento` varchar(60) DEFAULT NULL,
  `emp_bairro` varchar(60) DEFAULT NULL,
  `emp_cidade` varchar(60) DEFAULT NULL,
  `emp_uf` varchar(2) DEFAULT NULL,
  `emp_pessoa_contato` varchar(100) DEFAULT NULL,
  `emp_cargo_prim` varchar(50) DEFAULT NULL,
  `emp_contato_finan` varchar(50) DEFAULT NULL,
  `emp_rep_legal` varchar(100) DEFAULT NULL,
  `emp_cargo` varchar(255) DEFAULT NULL,
  `emp_rep_legal2` varchar(100) DEFAULT NULL,
  `emp_cargo2` varchar(50) DEFAULT NULL,
  `emp_email` varchar(100) DEFAULT NULL,
  `emp_email_financeiro` varchar(100) DEFAULT NULL,
  `emp_email_finan2` varchar(80) DEFAULT NULL,
  `emp_email_finan3` varchar(80) DEFAULT NULL,
  `emp_email_ass_eletronica` varchar(80) DEFAULT NULL,
  `emp_email_ass_testemunha` varchar(100) DEFAULT NULL,
  `emp_nome_ass_testemunha` varchar(100) DEFAULT NULL,
  `emp_cargo_ass_testemunha` varchar(50) DEFAULT NULL,
  `emp_cel_ass_testemunha` varchar(13) DEFAULT NULL,
  `emp_nascto_ass_testemunha` date DEFAULT NULL,
  `emp_email_conf_autentique1` varchar(80) DEFAULT NULL,
  `emp_email_conf_autentique2` varchar(80) DEFAULT NULL,
  `emp_email_conf_autentique3` varchar(80) DEFAULT NULL,
  `emp_vcto_boleto` int(2) DEFAULT NULL,
  `emp_email_resp_apdz` varchar(80) DEFAULT NULL,
  `emp_fone_fixo` varchar(14) DEFAULT NULL,
  `emp_celular` varchar(15) DEFAULT NULL,
  `emp_fone_finan` varchar(15) DEFAULT NULL,
  `emp_status` varchar(20) NOT NULL DEFAULT 'Ativo',
  `emp_data_cad` timestamp NOT NULL DEFAULT current_timestamp(),
  `emp_user_appa` varchar(30) NOT NULL,
  `emp_usuario` varchar(30) DEFAULT NULL,
  `emp_senha` varchar(32) DEFAULT NULL,
  `emp_ibge` int(10) DEFAULT NULL,
  `emp_resp_cobranca` varchar(40) DEFAULT NULL,
  `emp_limite_superv_estagio` int(2) DEFAULT NULL,
  `emp_nome_superv_alu` varchar(60) DEFAULT NULL,
  `emp_nome_finan2` varchar(60) DEFAULT NULL,
  `emp_nome_finan3` varchar(60) DEFAULT NULL,
  `emp_nome_ass_eletro` varchar(60) DEFAULT NULL,
  `emp_nome_acusa_receb1` varchar(60) DEFAULT NULL,
  `emp_nome_acusa_receb2` varchar(60) DEFAULT NULL,
  `emp_nome_acusa_receb3` varchar(60) DEFAULT NULL,
  `emp_cargo_superv_alu` varchar(60) DEFAULT NULL,
  `emp_cargo_finan1` varchar(60) DEFAULT NULL,
  `emp_cargo_finan2` varchar(60) DEFAULT NULL,
  `emp_cargo_finan3` varchar(60) DEFAULT NULL,
  `emp_cargo_ass_eletro` varchar(60) DEFAULT NULL,
  `emp_cargo_acusa_receb1` varchar(60) DEFAULT NULL,
  `emp_cargo_acusa_receb2` varchar(60) DEFAULT NULL,
  `emp_cargo_acusa_receb3` varchar(60) DEFAULT NULL,
  `emp_cel_superv_alu` varchar(60) DEFAULT NULL,
  `emp_cel_finan2` varchar(13) DEFAULT NULL,
  `emp_cel_finan3` varchar(13) DEFAULT NULL,
  `emp_cel_ass_eletro` varchar(13) DEFAULT NULL,
  `emp_cel_acusa_receb1` varchar(13) DEFAULT NULL,
  `emp_cel_acusa_receb2` varchar(13) DEFAULT NULL,
  `emp_cel_acusa_receb3` varchar(13) DEFAULT NULL,
  `emp_nascto_primario` date DEFAULT NULL,
  `emp_nascto_superv_alu` date DEFAULT NULL,
  `emp_nascto_finan1` date DEFAULT NULL,
  `emp_nascto_finan2` date DEFAULT NULL,
  `emp_nascto_finan3` date DEFAULT NULL,
  `emp_nascto_ass_eletro` date DEFAULT NULL,
  `emp_nascto_acusa_receb1` date DEFAULT NULL,
  `emp_nascto_acusa_receb2` date DEFAULT NULL,
  `emp_nascto_acusa_receb3` date DEFAULT NULL,
  `emp_gestor_ctt` int(11) DEFAULT NULL,
  `emp_prod_comercial` int(11) DEFAULT NULL,
  `emp_logo` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `empresas_agrupadas`
--

CREATE TABLE `empresas_agrupadas` (
  `ea_id` int(10) NOT NULL,
  `ea_id_grupo` int(10) NOT NULL,
  `ea_id_emp` int(10) NOT NULL,
  `ea_user_cad` varchar(60) NOT NULL,
  `ea_dt_cad` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `empresas_aviso_boleto`
--

CREATE TABLE `empresas_aviso_boleto` (
  `id` int(10) NOT NULL,
  `aeb_id_fatura` int(10) NOT NULL,
  `eab_dt_envio` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `empresas_grupo`
--

CREATE TABLE `empresas_grupo` (
  `eg_id` int(10) NOT NULL,
  `eg_nome_grupo` varchar(60) NOT NULL,
  `eg_user_cad` varchar(50) NOT NULL,
  `eg_dt_cad` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `empresas_restricao`
--

CREATE TABLE `empresas_restricao` (
  `re_pin` char(4) NOT NULL,
  `re_id_emp` int(10) DEFAULT NULL,
  `re_id_seg` int(1) DEFAULT NULL,
  `re_id_curso` int(10) DEFAULT NULL,
  `re_id_ctt_emp` int(10) DEFAULT NULL,
  `re_mod` varchar(3) DEFAULT NULL,
  `re_prot_curso` varchar(20) DEFAULT NULL,
  `re_terceirizada` varchar(1) DEFAULT NULL,
  `re_bloco_aluno` varchar(6) DEFAULT NULL,
  `re_status` int(1) DEFAULT 0,
  `re_usado` int(1) DEFAULT 0,
  `re_id_user_solicita` int(10) DEFAULT NULL,
  `re_dt_solicitacao` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `re_user_cad` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `empresas_tst`
--

CREATE TABLE `empresas_tst` (
  `emp_id` int(10) NOT NULL,
  `emp_id_resp_finan` int(10) DEFAULT NULL COMMENT 'empresa responsavel pelo pgto e adm dos contratados',
  `emp_modalidade` varchar(10) DEFAULT NULL,
  `emp_cnpj` varchar(18) NOT NULL,
  `emp_razao_social` varchar(200) NOT NULL,
  `emp_fantasia` varchar(100) DEFAULT NULL,
  `emp_terceirizada` int(1) NOT NULL DEFAULT 0,
  `emp_endereco` varchar(100) DEFAULT NULL,
  `emp_ender_alt` varchar(255) DEFAULT NULL,
  `emp_cep` int(10) DEFAULT NULL,
  `emp_nr_predio` varchar(10) DEFAULT NULL,
  `emp_complemento` varchar(60) DEFAULT NULL,
  `emp_bairro` varchar(60) DEFAULT NULL,
  `emp_cidade` varchar(60) DEFAULT NULL,
  `emp_uf` varchar(2) DEFAULT NULL,
  `emp_pessoa_contato` varchar(100) DEFAULT NULL,
  `emp_cargo_prim` varchar(50) DEFAULT NULL,
  `emp_contato_finan` varchar(50) DEFAULT NULL,
  `emp_rep_legal` varchar(100) DEFAULT NULL,
  `emp_cargo` varchar(255) DEFAULT NULL,
  `emp_rep_legal2` varchar(100) DEFAULT NULL,
  `emp_cargo2` varchar(50) DEFAULT NULL,
  `emp_email` varchar(100) DEFAULT NULL,
  `emp_email_financeiro` varchar(100) DEFAULT NULL,
  `emp_email_finan2` varchar(80) DEFAULT NULL,
  `emp_email_finan3` varchar(80) DEFAULT NULL,
  `emp_email_ass_eletronica` varchar(80) DEFAULT NULL,
  `emp_email_ass_testemunha` varchar(100) DEFAULT NULL,
  `emp_nome_ass_testemunha` varchar(100) DEFAULT NULL,
  `emp_cargo_ass_testemunha` varchar(50) DEFAULT NULL,
  `emp_cel_ass_testemunha` varchar(13) DEFAULT NULL,
  `emp_nascto_ass_testemunha` date DEFAULT NULL,
  `emp_email_conf_autentique1` varchar(80) DEFAULT NULL,
  `emp_email_conf_autentique2` varchar(80) DEFAULT NULL,
  `emp_email_conf_autentique3` varchar(80) DEFAULT NULL,
  `emp_vcto_boleto` int(2) DEFAULT NULL,
  `emp_email_resp_apdz` varchar(80) DEFAULT NULL,
  `emp_fone_fixo` varchar(14) DEFAULT NULL,
  `emp_celular` varchar(15) DEFAULT NULL,
  `emp_fone_finan` varchar(15) DEFAULT NULL,
  `emp_status` varchar(20) NOT NULL DEFAULT 'Ativo',
  `emp_data_cad` timestamp NOT NULL DEFAULT current_timestamp(),
  `emp_user_appa` varchar(30) NOT NULL,
  `emp_usuario` varchar(30) DEFAULT NULL,
  `emp_senha` varchar(32) DEFAULT NULL,
  `emp_ibge` int(10) DEFAULT NULL,
  `emp_resp_cobranca` varchar(40) DEFAULT NULL,
  `emp_limite_superv_estagio` int(2) DEFAULT NULL,
  `emp_nome_superv_alu` varchar(60) DEFAULT NULL,
  `emp_nome_finan2` varchar(60) DEFAULT NULL,
  `emp_nome_finan3` varchar(60) DEFAULT NULL,
  `emp_nome_ass_eletro` varchar(60) DEFAULT NULL,
  `emp_nome_acusa_receb1` varchar(60) DEFAULT NULL,
  `emp_nome_acusa_receb2` varchar(60) DEFAULT NULL,
  `emp_nome_acusa_receb3` varchar(60) DEFAULT NULL,
  `emp_cargo_superv_alu` varchar(60) DEFAULT NULL,
  `emp_cargo_finan1` varchar(60) DEFAULT NULL,
  `emp_cargo_finan2` varchar(60) DEFAULT NULL,
  `emp_cargo_finan3` varchar(60) DEFAULT NULL,
  `emp_cargo_ass_eletro` varchar(60) DEFAULT NULL,
  `emp_cargo_acusa_receb1` varchar(60) DEFAULT NULL,
  `emp_cargo_acusa_receb2` varchar(60) DEFAULT NULL,
  `emp_cargo_acusa_receb3` varchar(60) DEFAULT NULL,
  `emp_cel_superv_alu` varchar(60) DEFAULT NULL,
  `emp_cel_finan2` varchar(13) DEFAULT NULL,
  `emp_cel_finan3` varchar(13) DEFAULT NULL,
  `emp_cel_ass_eletro` varchar(13) DEFAULT NULL,
  `emp_cel_acusa_receb1` varchar(13) DEFAULT NULL,
  `emp_cel_acusa_receb2` varchar(13) DEFAULT NULL,
  `emp_cel_acusa_receb3` varchar(13) DEFAULT NULL,
  `emp_nascto_primario` date DEFAULT NULL,
  `emp_nascto_superv_alu` date DEFAULT NULL,
  `emp_nascto_finan1` date DEFAULT NULL,
  `emp_nascto_finan2` date DEFAULT NULL,
  `emp_nascto_finan3` date DEFAULT NULL,
  `emp_nascto_ass_eletro` date DEFAULT NULL,
  `emp_nascto_acusa_receb1` date DEFAULT NULL,
  `emp_nascto_acusa_receb2` date DEFAULT NULL,
  `emp_nascto_acusa_receb3` date DEFAULT NULL,
  `emp_gestor_ctt` int(11) DEFAULT NULL,
  `emp_prod_comercial` int(11) DEFAULT NULL,
  `emp_logo` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `envia_email_ead`
--

CREATE TABLE `envia_email_ead` (
  `ead_id` int(10) NOT NULL,
  `ead_cad_id` int(10) NOT NULL,
  `ead_user_appa` varchar(30) NOT NULL,
  `ead_data_cad` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `ead_nome` varchar(100) NOT NULL,
  `ead_curso` varchar(60) NOT NULL,
  `ead_nome_usuario_ava` varchar(60) DEFAULT NULL,
  `ead_senha_ava` varchar(15) DEFAULT NULL,
  `ead_empresa` varchar(100) NOT NULL,
  `ead_cidade` varchar(50) NOT NULL,
  `ead_dia_curso` varchar(20) NOT NULL,
  `ead_retorno` varchar(10) NOT NULL,
  `ead_data_contrato` varchar(25) NOT NULL,
  `ead_email_apdz` varchar(100) NOT NULL,
  `ead_email_empresa` varchar(100) DEFAULT NULL,
  `ead_email_emp_adm` varchar(70) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `escolaridade`
--

CREATE TABLE `escolaridade` (
  `escol_id` int(5) NOT NULL,
  `escol_escolaridade` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `estado_civil`
--

CREATE TABLE `estado_civil` (
  `ec_id` int(2) NOT NULL,
  `ec_estado` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `estagio_atividades`
--

CREATE TABLE `estagio_atividades` (
  `ea_id` int(10) NOT NULL,
  `ea_id_curso` int(10) NOT NULL,
  `ea_atividade` longtext NOT NULL,
  `ea_status` varchar(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `estagio_atividades_31_10_2026`
--

CREATE TABLE `estagio_atividades_31_10_2026` (
  `ea_id` int(10) NOT NULL,
  `ea_id_curso` int(10) NOT NULL,
  `ea_atividade` longtext NOT NULL,
  `ea_status` varchar(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `estagio_cursos`
--

CREATE TABLE `estagio_cursos` (
  `ec_id` int(10) NOT NULL,
  `ec_id_nivel` int(2) NOT NULL,
  `ec_curso` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `estagio_estudante_vinculado`
--

CREATE TABLE `estagio_estudante_vinculado` (
  `eev_id` int(10) NOT NULL,
  `eev_id_emp` int(10) NOT NULL,
  `eev_id_superv` int(10) NOT NULL,
  `eev_id_ctt_alu` int(10) NOT NULL,
  `eev_id_alu` int(10) NOT NULL,
  `eev_user_cad` varbinary(50) NOT NULL,
  `eev_dt_cad` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `estagio_ra`
--

CREATE TABLE `estagio_ra` (
  `etra_id` int(10) NOT NULL,
  `etra_id_aluno` int(10) NOT NULL,
  `etra_id_contrato` int(10) NOT NULL,
  `etra_id_curso` int(10) NOT NULL,
  `etra_id_emp` int(10) NOT NULL,
  `etra_id_seg` int(10) NOT NULL,
  `etra_periodo` varchar(23) NOT NULL,
  `etra_periodo_ra_ini` date DEFAULT NULL,
  `etra_periodo_ra_fim` date DEFAULT NULL,
  `etra_superv_estagio` varchar(80) NOT NULL,
  `etra_superv_estagio_cargo` varchar(80) NOT NULL,
  `etra_atividades` longtext NOT NULL,
  `etra_1` varchar(15) NOT NULL,
  `etra_2` varchar(15) NOT NULL,
  `etra_3` varchar(15) NOT NULL,
  `etra_4` varchar(15) NOT NULL,
  `etra_5` varchar(15) NOT NULL,
  `etra_6` varchar(15) NOT NULL,
  `etra_7` varchar(15) NOT NULL,
  `etra_8` varchar(15) DEFAULT NULL,
  `etra_9` varchar(15) NOT NULL,
  `etra_dt_cad` datetime NOT NULL,
  `etra_user_cad` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `estagio_recesso`
--

CREATE TABLE `estagio_recesso` (
  `re_id` int(10) NOT NULL,
  `re_id_ctt` int(10) NOT NULL,
  `re_id_aluno` int(10) NOT NULL,
  `re_id_emp` int(10) NOT NULL,
  `re_dt_ini` date NOT NULL,
  `re_dt_fim` date NOT NULL,
  `re_qtde_dias` int(5) NOT NULL,
  `re_user_cad` varchar(60) NOT NULL,
  `re_data_cad` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `estagio_seguradora`
--

CREATE TABLE `estagio_seguradora` (
  `id` int(10) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `apolice` varchar(15) DEFAULT NULL,
  `valor` varchar(10) DEFAULT NULL,
  `status` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `estagio_supervisores`
--

CREATE TABLE `estagio_supervisores` (
  `es_id` int(10) NOT NULL,
  `es_id_emp` int(10) NOT NULL,
  `es_gestar` int(1) DEFAULT NULL,
  `es_nome` varchar(250) NOT NULL,
  `es_cpf` varchar(15) DEFAULT NULL,
  `es_depto` varchar(100) NOT NULL,
  `es_unidade` varchar(40) DEFAULT NULL,
  `es_email` varchar(100) DEFAULT NULL,
  `es_user` varchar(15) DEFAULT NULL,
  `es_senha` varchar(32) DEFAULT NULL,
  `es_status` varchar(1) NOT NULL,
  `es_dt_cad` datetime NOT NULL,
  `es_dt_edit` datetime DEFAULT NULL,
  `es_user_cad` varchar(30) NOT NULL,
  `es_user_edit` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `estagio_tre`
--

CREATE TABLE `estagio_tre` (
  `etre_id` int(10) NOT NULL,
  `etre_id_aluno` int(10) NOT NULL,
  `etre_id_contrato` int(10) NOT NULL,
  `etre_id_curso` int(10) NOT NULL,
  `etre_id_emp` int(10) NOT NULL,
  `etre_id_seg` int(10) NOT NULL,
  `etre_periodo` varchar(23) DEFAULT NULL,
  `etre_dt_ini` date DEFAULT NULL,
  `etre_dt_fim` date DEFAULT NULL,
  `etre_superv_estagio` longtext DEFAULT NULL,
  `etre_superv_estagio_cargo` varchar(80) DEFAULT NULL,
  `etre_atividades` longtext NOT NULL,
  `etre_1` varchar(7) NOT NULL,
  `etre_2` varchar(7) NOT NULL,
  `etre_3` varchar(7) NOT NULL,
  `etre_4` varchar(7) NOT NULL,
  `etre_5` varchar(7) NOT NULL,
  `etre_6` varchar(7) NOT NULL,
  `etre_7` varchar(7) NOT NULL,
  `etre_8` varchar(7) NOT NULL,
  `etre_9` varchar(7) NOT NULL,
  `etre_10` varchar(7) NOT NULL,
  `etre_11` varchar(7) NOT NULL,
  `etre_12` varchar(7) NOT NULL,
  `etre_13` varchar(7) NOT NULL,
  `etre_14` varchar(7) NOT NULL,
  `etre_15` varchar(7) NOT NULL,
  `etre_dt_cad` datetime NOT NULL,
  `etre_user_cad` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `excluir_dados_bd`
--

CREATE TABLE `excluir_dados_bd` (
  `ed_id` int(10) NOT NULL,
  `ed_id_aluno` int(10) NOT NULL,
  `ed_id_ctt` int(10) NOT NULL,
  `ed_id_emp` int(10) DEFAULT NULL,
  `ed_id_curso` int(5) NOT NULL,
  `ed_id_seg` int(1) NOT NULL,
  `ed_vigencia` varchar(25) NOT NULL,
  `ed_justificativa` longtext NOT NULL,
  `ed_user_cad` varchar(30) NOT NULL,
  `ed_data_cad` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `facilitador`
--

CREATE TABLE `facilitador` (
  `f_id` int(10) NOT NULL,
  `f_nome` varchar(200) NOT NULL,
  `f_cpf` varchar(14) NOT NULL,
  `f_rg` varchar(50) DEFAULT NULL,
  `f_email` varchar(100) NOT NULL,
  `f_user` varchar(14) NOT NULL,
  `f_senha` varchar(32) NOT NULL,
  `f_status` int(1) NOT NULL DEFAULT 1,
  `f_unidade` int(1) NOT NULL,
  `f_dt_cad` datetime NOT NULL,
  `f_user_cad` varchar(50) NOT NULL,
  `f_dt_edit` datetime DEFAULT NULL,
  `f_user_edit` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `facilitador_turma`
--

CREATE TABLE `facilitador_turma` (
  `ft_id` int(10) NOT NULL,
  `ft_id_facilitador` int(10) NOT NULL,
  `ft_id_turma` int(10) NOT NULL,
  `ft_dt_cad` datetime NOT NULL,
  `ft_user_cad` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `feriados`
--

CREATE TABLE `feriados` (
  `id` int(11) NOT NULL COMMENT 'ID único do feriado',
  `data` date NOT NULL COMMENT 'Data do feriado (formato AAAA-MM-DD)',
  `nome` varchar(100) NOT NULL COMMENT 'Nome do feriado',
  `abrangencia` enum('Nacional','Estadual','Municipal') NOT NULL DEFAULT 'Nacional' COMMENT 'Nível de abrangência do feriado',
  `uf` char(2) DEFAULT NULL COMMENT 'UF para feriados estaduais/municipais (ex: PA)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tabela de feriados nacionais e estaduais do Pará';

-- --------------------------------------------------------

--
-- Estrutura para tabela `finan_banco`
--

CREATE TABLE `finan_banco` (
  `fb_id` int(4) NOT NULL,
  `fb_nome` varchar(30) DEFAULT NULL,
  `fb_nr_ag` varchar(40) DEFAULT NULL,
  `fb_nr_cc` varchar(15) DEFAULT NULL,
  `fb_nr_op` varchar(5) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `finan_extrato`
--

CREATE TABLE `finan_extrato` (
  `e_id` int(10) NOT NULL,
  `e_data_rec_desp` date DEFAULT NULL,
  `e_id_banco` int(11) DEFAULT NULL,
  `e_token` varchar(10) DEFAULT NULL,
  `e_id_tipo_desp` int(10) DEFAULT NULL,
  `e_id_tipo_rec` int(10) DEFAULT NULL,
  `e_id_banco_tb_D` int(2) DEFAULT NULL,
  `e_id_banco_tb_R` int(2) DEFAULT NULL,
  `e_id_unidade` int(1) DEFAULT NULL,
  `e_id_cobranca` int(10) DEFAULT NULL,
  `e_valor_receita` decimal(10,2) DEFAULT NULL,
  `e_valor_despesa` decimal(10,2) DEFAULT NULL,
  `e_obs` varchar(40) DEFAULT NULL,
  `e_arquivo` varchar(255) DEFAULT NULL,
  `e_user_cad` varchar(40) DEFAULT NULL,
  `e_dt_cad` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `finan_tipo_despesa`
--

CREATE TABLE `finan_tipo_despesa` (
  `td_id` int(10) NOT NULL,
  `td_nome` varchar(40) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `finan_tipo_despesa_sub`
--

CREATE TABLE `finan_tipo_despesa_sub` (
  `tds_id` int(10) NOT NULL,
  `tds_id_grupo` int(10) DEFAULT NULL,
  `tds_nome` varchar(40) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `finan_tipo_receita`
--

CREATE TABLE `finan_tipo_receita` (
  `tr_id` int(10) NOT NULL,
  `tr_nome` varchar(40) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `folha_pgto_emp`
--

CREATE TABLE `folha_pgto_emp` (
  `fpe_id` int(10) NOT NULL,
  `fpe_id_emp` int(10) NOT NULL,
  `fpe_id_seg` int(2) NOT NULL,
  `fpe_id_ctt_alu` int(10) NOT NULL,
  `fpe_id_aluno` int(10) NOT NULL,
  `fpe_compet` date NOT NULL,
  `fpe_vlr_bolsa` decimal(10,2) NOT NULL,
  `fpe_vlr_transp` decimal(10,2) NOT NULL,
  `fpe_vlr_total` decimal(10,2) NOT NULL,
  `fpe_vlr_tx_adm` decimal(10,2) NOT NULL,
  `fpe_transmitida` int(11) NOT NULL DEFAULT 0,
  `fpe_user_cad` varchar(50) NOT NULL,
  `fpe_dt_cad` date NOT NULL,
  `fpe_dt_transmissao` datetime NOT NULL,
  `fpe_token` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `frase_motivacional_cob_emp`
--

CREATE TABLE `frase_motivacional_cob_emp` (
  `fm_id` int(9) NOT NULL,
  `fm_frase` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `frequencia`
--

CREATE TABLE `frequencia` (
  `pf_id` int(10) NOT NULL,
  `pf_data_aula` varchar(10) NOT NULL,
  `pf_horario` varchar(50) DEFAULT NULL,
  `pf_justificada` varchar(50) DEFAULT NULL,
  `pf_id_aluno` int(10) NOT NULL,
  `pf_nome_aluno` varchar(100) DEFAULT NULL,
  `pf_id_empresa` int(10) NOT NULL,
  `pf_pf` varchar(50) NOT NULL,
  `pf_data_cad` timestamp NOT NULL DEFAULT current_timestamp(),
  `pf_usu_appa` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `frequencia_aluno`
--

CREATE TABLE `frequencia_aluno` (
  `id` int(10) NOT NULL,
  `id_aluno` int(10) NOT NULL,
  `turma` int(10) NOT NULL,
  `freq` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `frequencia_master`
--

CREATE TABLE `frequencia_master` (
  `freq_id` int(10) NOT NULL,
  `freq_data_aula` date NOT NULL,
  `freq_id_data_aula` int(10) NOT NULL,
  `freq_motivo` varchar(50) DEFAULT NULL,
  `freq_justificada` varchar(3) DEFAULT NULL,
  `freq_id_aluno` int(10) NOT NULL,
  `freq_id_curso` int(5) DEFAULT NULL,
  `freq_id_turma` int(5) NOT NULL,
  `freq_id_empresa` int(10) NOT NULL DEFAULT 0,
  `freq_pf` varchar(2) NOT NULL,
  `freq_anexo` varchar(100) DEFAULT NULL,
  `freq_data_cad` timestamp NOT NULL DEFAULT current_timestamp(),
  `freq_usu_cad` varchar(30) NOT NULL,
  `freq_usu_edit` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `frequencia_master_arquivo_morto`
--

CREATE TABLE `frequencia_master_arquivo_morto` (
  `freq_id` int(10) NOT NULL,
  `freq_data_aula` date NOT NULL,
  `freq_id_data_aula` int(10) NOT NULL,
  `freq_motivo` varchar(50) DEFAULT NULL,
  `freq_justificada` varchar(3) DEFAULT NULL,
  `freq_id_aluno` int(10) NOT NULL,
  `freq_id_curso` int(5) DEFAULT NULL,
  `freq_id_turma` int(5) NOT NULL,
  `freq_id_empresa` int(10) NOT NULL DEFAULT 0,
  `freq_pf` varchar(2) NOT NULL,
  `freq_anexo` varchar(100) DEFAULT 'nenhum',
  `freq_data_cad` timestamp NOT NULL DEFAULT current_timestamp(),
  `freq_usu_cad` varchar(30) NOT NULL,
  `freq_usu_edit` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `historico_acessos`
--

CREATE TABLE `historico_acessos` (
  `ace_id` int(10) NOT NULL,
  `usu_id` int(5) NOT NULL,
  `ace_ip` char(50) NOT NULL,
  `ace_last_login` datetime NOT NULL,
  `ace_last_activity` datetime NOT NULL,
  `ace_session` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `historico_acessos_alu`
--

CREATE TABLE `historico_acessos_alu` (
  `ace_id` int(10) NOT NULL,
  `usu_id` int(5) NOT NULL,
  `ace_ip` char(15) NOT NULL,
  `ace_last_login` datetime NOT NULL,
  `ace_last_activity` datetime NOT NULL,
  `ace_session` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `historico_acessos_emp`
--

CREATE TABLE `historico_acessos_emp` (
  `ace_id` int(10) NOT NULL,
  `usu_id` int(5) NOT NULL,
  `ace_ip` char(15) NOT NULL,
  `ace_last_login` datetime NOT NULL,
  `ace_last_activity` datetime NOT NULL,
  `ace_session` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `historico_pgto_contrato`
--

CREATE TABLE `historico_pgto_contrato` (
  `id` int(20) NOT NULL,
  `id_aluno` int(10) NOT NULL,
  `id_emp` int(10) NOT NULL,
  `id_contrato` int(10) NOT NULL,
  `id_seg` int(1) NOT NULL,
  `parcela` int(11) NOT NULL,
  `competencia` date NOT NULL,
  `valor_cob` decimal(10,2) NOT NULL DEFAULT 0.00,
  `deducao` int(1) NOT NULL DEFAULT 0,
  `cob_indevida` int(11) NOT NULL,
  `valor_ctt` decimal(10,2) DEFAULT NULL,
  `dt_ini` date NOT NULL,
  `dt_fim` date NOT NULL,
  `dt_deslig` date DEFAULT NULL,
  `cccd` int(1) NOT NULL DEFAULT 0 COMMENT 'cancelar cob de ctt deslig',
  `obs` varchar(250) DEFAULT NULL,
  `dt_cad` timestamp NOT NULL DEFAULT current_timestamp(),
  `user_edit` varchar(50) DEFAULT NULL,
  `dt_edit` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `historico_pgto_empresas`
--

CREATE TABLE `historico_pgto_empresas` (
  `hpe_id` int(10) NOT NULL,
  `hpe_id_emp` int(10) DEFAULT NULL,
  `hpe_competencia` date DEFAULT NULL,
  `hpe_dt_vcto` date DEFAULT NULL,
  `hpe_dt_pgto` date DEFAULT NULL,
  `hpe_valor_pago` decimal(10,2) DEFAULT 0.00,
  `hpe_nr_nf` int(9) DEFAULT NULL,
  `hpe_valor_original` decimal(10,2) DEFAULT NULL,
  `hpe_valor_desc_acre` decimal(10,2) NOT NULL DEFAULT 0.00,
  `hpe_valor_encerr` decimal(10,2) DEFAULT NULL,
  `hpe_qtde_deslig` int(5) DEFAULT 0,
  `hpe_qtde_tce_apdz` int(5) DEFAULT 0,
  `hpe_qtde_tae` int(5) DEFAULT 0,
  `hpe_qtde_encerr` int(5) DEFAULT 0,
  `hpe_id_banco` varchar(2) DEFAULT NULL,
  `hpe_id_seg` int(1) DEFAULT NULL,
  `hpe_obs` varchar(250) DEFAULT NULL,
  `hpe_obs_desc_acre` varchar(250) DEFAULT NULL,
  `hpe_file_bol` varchar(250) DEFAULT NULL,
  `hpe_file_nf` varchar(250) DEFAULT NULL,
  `hpe_file_esp_cob` varchar(250) DEFAULT NULL,
  `hpe_cob_ctt_deslig` longtext DEFAULT NULL,
  `hpe_cob_ctt_tce_apz` longtext DEFAULT NULL,
  `hpe_cob_ctt_tae` longtext DEFAULT NULL,
  `hpe_cob_ctt_encerr` longtext DEFAULT NULL,
  `hpe_notifica_emp` int(11) NOT NULL DEFAULT 0,
  `hpe_dt_notif_emp` datetime DEFAULT NULL,
  `hpe_reg_fluxo_cx` int(1) NOT NULL DEFAULT 0,
  `hpe_qd_resumo` longtext DEFAULT NULL,
  `hpe_dt_cad` datetime NOT NULL,
  `hpe_user_cad` varchar(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `instituicao_ensino`
--

CREATE TABLE `instituicao_ensino` (
  `ie_id` int(10) NOT NULL,
  `ie_nome` varchar(100) NOT NULL,
  `ie_representante` varchar(80) DEFAULT NULL,
  `ie_fone_fixo1` varchar(12) DEFAULT NULL,
  `ie_fone_fixo2` varchar(12) DEFAULT NULL,
  `ie_fone_cel1` varchar(13) DEFAULT NULL,
  `ie_fone_cel2` varchar(13) DEFAULT NULL,
  `ie_email1` varchar(80) DEFAULT NULL,
  `ie_email2` varchar(80) DEFAULT NULL,
  `ie_email3` varchar(80) DEFAULT NULL,
  `ie_cnpj` varchar(18) NOT NULL,
  `ie_tipo` varchar(1) DEFAULT NULL,
  `ie_cod_inep` varchar(15) DEFAULT NULL,
  `ie_razao_social` varchar(200) NOT NULL,
  `ie_rep_legal_cpf` varchar(15) NOT NULL,
  `ie_rep_legal_rg` varchar(15) NOT NULL,
  `ie_rep_legal_cargo` varchar(50) NOT NULL,
  `ie_sup_estagio` varchar(80) NOT NULL,
  `ie_sup_estagio_cargo` varchar(70) DEFAULT NULL,
  `ie_resp_ass_ctt1` varchar(100) DEFAULT NULL,
  `ie_resp_ass_ctt2` varchar(100) DEFAULT NULL,
  `ie_endereco` varchar(100) DEFAULT NULL,
  `ie_complemento` varchar(80) DEFAULT NULL,
  `ie_num_predio` varchar(10) NOT NULL,
  `ie_bairro` varchar(50) NOT NULL,
  `ie_cep` varchar(10) NOT NULL,
  `ie_cidade` varchar(50) NOT NULL,
  `ie_uf` varchar(2) NOT NULL,
  `ie_visivel_alunos` int(1) DEFAULT 1,
  `ie_visivel_contrato` varchar(1) NOT NULL DEFAULT '1',
  `ie_contato_nome` varchar(80) DEFAULT NULL,
  `ie_contato_cargo` varchar(60) DEFAULT NULL,
  `ie_contato_fone` varchar(15) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `instituicao_ensino_curso`
--

CREATE TABLE `instituicao_ensino_curso` (
  `iec_id` int(10) NOT NULL,
  `iec_id_ie` int(10) NOT NULL,
  `iec_nivel` int(1) NOT NULL,
  `iec_curso` int(10) DEFAULT NULL,
  `iec_turno` int(1) NOT NULL,
  `iec_validade` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `instituicao_ensino_curso_base`
--

CREATE TABLE `instituicao_ensino_curso_base` (
  `iecb_id` int(10) NOT NULL,
  `iecb_nivel` int(1) NOT NULL,
  `iecb_curso` varchar(100) DEFAULT NULL,
  `iecb_validade` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `instituicao_ensino_nivel`
--

CREATE TABLE `instituicao_ensino_nivel` (
  `ien_id` int(10) NOT NULL,
  `ien_id_ie` int(10) NOT NULL,
  `ien_nivel` int(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `instituicao_ensino_resp_estagio`
--

CREATE TABLE `instituicao_ensino_resp_estagio` (
  `iere_id` int(10) NOT NULL,
  `iere_id_ie` int(10) NOT NULL,
  `iere_id_polo` int(10) NOT NULL,
  `iere_tipo` varchar(1) NOT NULL,
  `iere_cpf` varchar(14) DEFAULT NULL,
  `iere_rg` varchar(30) NOT NULL,
  `iere_nome` varchar(250) NOT NULL,
  `iere_cargo` varchar(60) DEFAULT NULL,
  `iere_local_ie` varchar(50) NOT NULL,
  `iere_dt_cad` timestamp NULL DEFAULT current_timestamp(),
  `iere_user_cad` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `instituicao_periodo`
--

CREATE TABLE `instituicao_periodo` (
  `iep_id` int(1) NOT NULL,
  `iep_periodo` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `jornada_estagio`
--

CREATE TABLE `jornada_estagio` (
  `je_id` int(10) NOT NULL,
  `je_jornada` longtext DEFAULT NULL,
  `je_turno` varchar(5) DEFAULT NULL,
  `je_user_cad` varchar(60) DEFAULT NULL,
  `je_dt_cad` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `jornada_trab_pratica`
--

CREATE TABLE `jornada_trab_pratica` (
  `jtp_id` int(5) NOT NULL,
  `jtp_unidade` int(3) NOT NULL,
  `jtp_descrcaoP` varchar(255) NOT NULL,
  `jtp_turno` varchar(5) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `jornada_trab_teorica`
--

CREATE TABLE `jornada_trab_teorica` (
  `jtt_id` int(5) NOT NULL,
  `jtt_unidade` int(3) NOT NULL,
  `jtt_descrcaoT` varchar(255) NOT NULL,
  `jtt_turno` varchar(5) DEFAULT NULL,
  `jtt_status` int(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `justificar_falta`
--

CREATE TABLE `justificar_falta` (
  `jf_id` int(10) NOT NULL,
  `jf_id_contrato` int(10) NOT NULL,
  `jf_dt_aula` date DEFAULT NULL,
  `jf_file` varchar(250) NOT NULL,
  `jf_status` int(1) NOT NULL DEFAULT 0,
  `jf_motivo_recusa` varchar(100) DEFAULT NULL,
  `jf_user_cad` int(10) NOT NULL,
  `jf_dt_cad` datetime NOT NULL,
  `jf_user_edit` varchar(60) DEFAULT NULL,
  `jf_dt_edit` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `justifica_frequencia`
--

CREATE TABLE `justifica_frequencia` (
  `just_freq_id` int(10) NOT NULL,
  `just_freq_status` varchar(50) NOT NULL,
  `just_freq_data_cad` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `material_didatico`
--

CREATE TABLE `material_didatico` (
  `md_id` int(10) NOT NULL,
  `md_curso` varchar(200) NOT NULL,
  `md_id_curso` int(10) NOT NULL,
  `md_disciplina` varchar(100) NOT NULL,
  `md_professor` varchar(50) NOT NULL,
  `md_nome_md` varchar(60) NOT NULL,
  `md_mat_didatico` varchar(400) NOT NULL,
  `md_data_cad` timestamp NOT NULL DEFAULT current_timestamp(),
  `md_usser_appa` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `md_aluno_curso`
--

CREATE TABLE `md_aluno_curso` (
  `md_ac_id` int(10) NOT NULL,
  `md_ac_id_aluno` int(10) NOT NULL,
  `md_ac_id_curso` int(10) NOT NULL,
  `md_ac_id_empresa` int(10) NOT NULL,
  `md_ac_id_alocacao` int(10) NOT NULL,
  `md_user_appa` varchar(50) NOT NULL,
  `md_data_cad` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `mensagens_enviadas`
--

CREATE TABLE `mensagens_enviadas` (
  `me_id` int(10) NOT NULL,
  `me_id_mm` int(10) NOT NULL,
  `me_id_emp` int(10) NOT NULL,
  `me_id_seg` int(1) NOT NULL,
  `me_email` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `mensagens_modelo`
--

CREATE TABLE `mensagens_modelo` (
  `mm_id` int(10) NOT NULL,
  `mm_assunto` varchar(250) DEFAULT NULL,
  `mm_mensagem` longtext DEFAULT NULL,
  `mm_user_cad` varchar(50) NOT NULL,
  `mm_dt_cad` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `mesalidade`
--

CREATE TABLE `mesalidade` (
  `mens_id` int(10) NOT NULL,
  `mens_updt_usu_appa` varchar(30) NOT NULL,
  `mens_stt_fin1` varchar(15) NOT NULL,
  `mens_stt_fin2` varchar(15) DEFAULT NULL,
  `mens_stt_fin3` varchar(15) DEFAULT NULL,
  `mens_stt_fin4` varchar(15) DEFAULT NULL,
  `mens_stt_fin5` varchar(15) DEFAULT NULL,
  `mens_stt_fin6` varchar(15) DEFAULT NULL,
  `mens_stt_fin7` varchar(15) DEFAULT NULL,
  `mens_stt_fin8` varchar(15) DEFAULT NULL,
  `mens_stt_fin9` varchar(15) DEFAULT NULL,
  `mens_stt_fin10` varchar(15) DEFAULT NULL,
  `mens_stt_fin11` varchar(15) DEFAULT NULL,
  `mens_stt_fin12` varchar(15) DEFAULT NULL,
  `mens_stt_fin13` varchar(15) DEFAULT NULL,
  `mens_stt_fin14` varchar(15) DEFAULT NULL,
  `mens_stt_fin15` varchar(15) DEFAULT NULL,
  `mens_stt_fin16` varchar(15) DEFAULT NULL,
  `mens_stt_fin17` varchar(15) DEFAULT NULL,
  `mens_stt_fin18` varchar(15) DEFAULT NULL,
  `mens_stt_fin19` varchar(15) DEFAULT NULL,
  `mens_stt_fin20` varchar(15) DEFAULT NULL,
  `mens_dt_bol1` varchar(10) DEFAULT NULL,
  `mens_dt_bol2` varchar(10) DEFAULT NULL,
  `mens_dt_bol3` varchar(10) DEFAULT NULL,
  `mens_dt_bol4` varchar(10) DEFAULT NULL,
  `mens_dt_bol5` varchar(10) DEFAULT NULL,
  `mens_dt_bol6` varchar(10) DEFAULT NULL,
  `mens_dt_bol7` varchar(10) DEFAULT NULL,
  `mens_dt_bol8` varchar(10) DEFAULT NULL,
  `mens_dt_bol9` varchar(10) DEFAULT NULL,
  `mens_dt_bol10` varchar(10) DEFAULT NULL,
  `mens_dt_bol11` varchar(10) DEFAULT NULL,
  `mens_dt_bol12` varchar(10) DEFAULT NULL,
  `mens_dt_bol13` varchar(10) DEFAULT NULL,
  `mens_dt_bol14` varchar(10) DEFAULT NULL,
  `mens_dt_bol15` varchar(10) DEFAULT NULL,
  `mens_dt_bol16` varchar(10) DEFAULT NULL,
  `mens_dt_bol17` varchar(10) DEFAULT NULL,
  `mens_dt_bol18` varchar(10) DEFAULT NULL,
  `mens_dt_bol19` varchar(10) DEFAULT NULL,
  `mens_dt_bol20` varchar(10) DEFAULT NULL,
  `mens_id_aluno` int(10) NOT NULL,
  `mens_nome_aluno` varchar(100) NOT NULL,
  `mens_data_cad` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `meses`
--

CREATE TABLE `meses` (
  `id` varchar(2) NOT NULL,
  `mes` varchar(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `modalidade_curso`
--

CREATE TABLE `modalidade_curso` (
  `mod_c_id` int(10) NOT NULL,
  `mod_c_modalidade` varchar(100) NOT NULL,
  `mod_c_modalidade_resumido` varchar(10) NOT NULL,
  `mod_c_data_cad` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `modalidade_empresa`
--

CREATE TABLE `modalidade_empresa` (
  `mod_emp_id` int(5) NOT NULL,
  `mod_emp_mod` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `montar_turma`
--

CREATE TABLE `montar_turma` (
  `freq_id` int(10) NOT NULL,
  `freq_id_aluno` int(10) NOT NULL,
  `freq_id_turma` int(5) NOT NULL,
  `freq_id_contrato` int(11) DEFAULT 0,
  `freq_id_ctt_emp` int(10) NOT NULL DEFAULT 0,
  `freq_curso` varchar(200) NOT NULL,
  `freq_id_curso` int(10) NOT NULL,
  `freq_dt_listar_nome_ini` date DEFAULT NULL,
  `freq_dt_listar_nome_fim` date DEFAULT NULL,
  `freq_curso_curso` varchar(200) NOT NULL,
  `freq_dia_retorno` varchar(30) DEFAULT NULL,
  `freq_empresa` varchar(200) DEFAULT NULL,
  `freq_aluno` varchar(200) NOT NULL,
  `freq_id_empresa` int(10) NOT NULL DEFAULT 0,
  `freq_dt_inicio` date DEFAULT NULL,
  `freq_dt_fim` date DEFAULT NULL,
  `freq_data` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `freq_user_appa` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `montar_turma_base_teste`
--

CREATE TABLE `montar_turma_base_teste` (
  `freq_id` int(10) NOT NULL,
  `freq_id_aluno` int(10) NOT NULL,
  `freq_id_turma` int(5) NOT NULL,
  `freq_id_contrato` int(11) DEFAULT 0,
  `freq_id_ctt_emp` int(10) NOT NULL DEFAULT 0,
  `freq_curso` varchar(200) NOT NULL,
  `freq_id_curso` int(10) NOT NULL,
  `freq_dt_listar_nome_ini` date DEFAULT NULL,
  `freq_dt_listar_nome_fim` date DEFAULT NULL,
  `freq_curso_curso` varchar(200) NOT NULL,
  `freq_dia_retorno` varchar(30) DEFAULT NULL,
  `freq_empresa` varchar(200) DEFAULT NULL,
  `freq_aluno` varchar(200) NOT NULL,
  `freq_id_empresa` int(10) NOT NULL DEFAULT 0,
  `freq_dt_inicio` date DEFAULT NULL,
  `freq_dt_fim` date DEFAULT NULL,
  `freq_data` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `freq_user_appa` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `montar_turma_tst`
--

CREATE TABLE `montar_turma_tst` (
  `freq_id` int(10) NOT NULL,
  `freq_id_aluno` int(10) NOT NULL,
  `freq_id_turma` int(5) NOT NULL,
  `freq_id_contrato` int(11) DEFAULT 0,
  `freq_id_ctt_emp` int(10) NOT NULL DEFAULT 0,
  `freq_curso` varchar(200) NOT NULL,
  `freq_id_curso` int(10) NOT NULL,
  `freq_dt_listar_nome_ini` date DEFAULT NULL,
  `freq_dt_listar_nome_fim` date DEFAULT NULL,
  `freq_curso_curso` varchar(200) NOT NULL,
  `freq_dia_retorno` varchar(30) DEFAULT NULL,
  `freq_empresa` varchar(200) DEFAULT NULL,
  `freq_aluno` varchar(200) NOT NULL,
  `freq_id_empresa` int(10) NOT NULL DEFAULT 0,
  `freq_dt_inicio` date DEFAULT NULL,
  `freq_dt_fim` date DEFAULT NULL,
  `freq_data` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `freq_user_appa` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `nivel_educacional`
--

CREATE TABLE `nivel_educacional` (
  `ne_id` int(3) NOT NULL,
  `ne_nivel` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `notas`
--

CREATE TABLE `notas` (
  `nota_id` int(10) NOT NULL,
  `nota_id_aluno` int(10) NOT NULL,
  `nota_id_disciplina` int(10) DEFAULT NULL,
  `nota_id_empresa` int(10) NOT NULL,
  `nota_nome_aluno` varchar(100) NOT NULL,
  `nota_disciplina` varchar(300) NOT NULL,
  `nota_nota` decimal(3,1) DEFAULT NULL,
  `nota_usu_appa` varchar(30) NOT NULL,
  `nota_data_cad` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `notifica_aluno`
--

CREATE TABLE `notifica_aluno` (
  `na_id` int(10) NOT NULL,
  `na_id_id_aluno` int(10) NOT NULL,
  `na_nome` varchar(80) NOT NULL,
  `na_email` varchar(80) NOT NULL,
  `na_usuario` varchar(50) NOT NULL,
  `na_senha` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `notifica_aviso_ferias_apz`
--

CREATE TABLE `notifica_aviso_ferias_apz` (
  `nafa_id` int(10) NOT NULL,
  `nafa_id_emp` int(10) NOT NULL,
  `nafa_mes_ferias` date NOT NULL,
  `nafa_dt_cad` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `notifica_ctt_nep_ser_estacio`
--

CREATE TABLE `notifica_ctt_nep_ser_estacio` (
  `id` int(10) NOT NULL,
  `id_emp` int(10) NOT NULL,
  `id_ie` int(10) NOT NULL,
  `ini_ctt` date NOT NULL,
  `dt_cad` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `notifica_fim_contrato`
--

CREATE TABLE `notifica_fim_contrato` (
  `nfc_id` int(10) NOT NULL,
  `nfc_id_emp` int(10) DEFAULT NULL,
  `nfc_id_seg` int(1) DEFAULT NULL,
  `nfc_ctt_fim_ref` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `notifica_seguro_estagio`
--

CREATE TABLE `notifica_seguro_estagio` (
  `nse_id` int(10) NOT NULL,
  `nse_id_aluno` int(10) NOT NULL,
  `nse_id_contrato` int(10) NOT NULL,
  `nse_aluno` varchar(80) NOT NULL,
  `nse_cpf` varchar(14) NOT NULL,
  `nse_nascto` date NOT NULL,
  `nse_nascto2` varchar(10) NOT NULL,
  `nse_dt_ini` date NOT NULL,
  `nse_dt_fim` date NOT NULL,
  `nse_dt_ini2` varchar(10) NOT NULL,
  `nse_dt_fim2` varchar(10) NOT NULL,
  `nse_dt_cad` datetime NOT NULL,
  `nse_user_cad` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `operadora_telefone`
--

CREATE TABLE `operadora_telefone` (
  `op_id` int(5) NOT NULL,
  `op_nome` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `origem_cpf`
--

CREATE TABLE `origem_cpf` (
  `orig_cpf_id` int(5) NOT NULL,
  `orig_cpf_origem` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `provisionar_pgto`
--

CREATE TABLE `provisionar_pgto` (
  `pp_id` int(10) NOT NULL,
  `pp_id_unidade` int(1) DEFAULT NULL,
  `pp_desc_conta` varchar(200) DEFAULT NULL,
  `pp_arquivo` varchar(250) DEFAULT NULL,
  `pp_valor` decimal(10,2) DEFAULT NULL,
  `pp_parcela` varchar(7) DEFAULT NULL,
  `pp_vcto` date DEFAULT NULL,
  `pp_cod_barras` longtext DEFAULT NULL,
  `pp_obs` longtext DEFAULT NULL,
  `pp_user_cad` varchar(60) DEFAULT NULL,
  `pp_exibe_tela` int(1) NOT NULL DEFAULT 1,
  `pp_data_cad` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `provisionar_pgto_compartilhado`
--

CREATE TABLE `provisionar_pgto_compartilhado` (
  `ppc_id` int(10) NOT NULL,
  `ppc_id_user1` varchar(60) DEFAULT NULL,
  `ppc_id_user2` varchar(60) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `quest_socio_economico`
--

CREATE TABLE `quest_socio_economico` (
  `qse_id` int(10) NOT NULL,
  `qse_id_ctt` int(10) DEFAULT NULL,
  `qse_deficiencia` int(10) DEFAULT NULL,
  `qse_id_aluno` int(10) NOT NULL,
  `qse_casa` varchar(20) NOT NULL,
  `qse_tipo_habitacao` varchar(20) NOT NULL,
  `qse_qtde_moradores_casa` int(2) NOT NULL,
  `qse_membro_familiar` varchar(255) NOT NULL,
  `qse_acompanhamento` varchar(255) NOT NULL,
  `qse_qtde_membros_trabalho` int(2) NOT NULL,
  `qse_renda_familiar` varchar(20) NOT NULL,
  `qse_bolsa_fam` int(1) DEFAULT NULL,
  `qse_peti` int(1) DEFAULT NULL,
  `qse_bpc` int(1) DEFAULT NULL,
  `qse_habitacao` int(1) DEFAULT NULL,
  `qse_passe_facil` int(1) DEFAULT NULL,
  `qse_outros` int(1) DEFAULT NULL,
  `qse_antes_apdz_trab` varchar(255) NOT NULL,
  `qse_rep_prog_apdz` varchar(255) NOT NULL,
  `qse_user_cad` varchar(40) NOT NULL,
  `qse_dt_cad` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `reinvidicar_contrato`
--

CREATE TABLE `reinvidicar_contrato` (
  `rc_id` int(10) NOT NULL,
  `rc_id_ctt` int(10) DEFAULT NULL,
  `rc_justif` longtext DEFAULT NULL,
  `rc_status` int(1) NOT NULL DEFAULT 0,
  `rc_dt_cad` timestamp NULL DEFAULT NULL,
  `rc_user_cad` varchar(60) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `rel_comport`
--

CREATE TABLE `rel_comport` (
  `rc_id` int(10) NOT NULL,
  `rc_id_aluno` int(10) NOT NULL,
  `rc_nome_aluno` varchar(100) NOT NULL,
  `rc_relatorio` longtext NOT NULL,
  `rc_data_cad` timestamp NOT NULL DEFAULT current_timestamp(),
  `rc_id_empresa` int(10) NOT NULL,
  `rc_usu_appa_cad` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `requerimento`
--

CREATE TABLE `requerimento` (
  `req_id` int(10) NOT NULL,
  `req_aluno` varchar(100) DEFAULT NULL,
  `req_id_aluno` int(10) DEFAULT NULL,
  `req_id_contrato` int(10) DEFAULT NULL,
  `req_email_aluno` varchar(100) DEFAULT NULL,
  `req_formato_certif` varchar(10) DEFAULT NULL,
  `req_dt_inicio` date DEFAULT NULL,
  `req_dt_fim` date DEFAULT NULL,
  `req_carga_h` int(5) DEFAULT NULL,
  `req_livro` int(3) DEFAULT NULL,
  `req_folha` int(3) DEFAULT NULL,
  `req_dt_cad` timestamp NOT NULL DEFAULT current_timestamp(),
  `req_dt_abertura` datetime DEFAULT NULL,
  `req_user_appa` varchar(60) DEFAULT NULL,
  `req_aberto_por` varchar(60) DEFAULT NULL,
  `req_solicitacao` varchar(50) DEFAULT NULL,
  `req_justif_escla` longtext DEFAULT NULL,
  `req_resp_appa` longtext DEFAULT NULL,
  `req_prev_entrega` date DEFAULT NULL,
  `req_curso` varchar(60) DEFAULT NULL,
  `req_cidade` varchar(50) DEFAULT NULL,
  `req_uf` varchar(2) DEFAULT NULL,
  `req_status_fin` varchar(20) DEFAULT NULL,
  `req_mes_atraso` varchar(100) DEFAULT NULL,
  `req_status` varchar(30) DEFAULT 'ABERTO'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `requerimento_cursos`
--

CREATE TABLE `requerimento_cursos` (
  `reqc_id` int(10) NOT NULL,
  `reqc_curso` varchar(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `requerimento_feedback`
--

CREATE TABLE `requerimento_feedback` (
  `rf_id` int(10) NOT NULL,
  `rf_id_req` varchar(10) NOT NULL,
  `rf_aluno` varchar(100) NOT NULL,
  `rf_id_aluno` int(10) NOT NULL,
  `rf_email` varchar(100) NOT NULL,
  `rf_solicitacao` varchar(50) NOT NULL,
  `rf_curso` varchar(60) NOT NULL,
  `rf_just_escla` longtext NOT NULL,
  `rf_status` varchar(30) NOT NULL,
  `rf_prev_entrega` date NOT NULL,
  `rf_user_appa` varchar(50) NOT NULL,
  `rf_data_cad` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `salario_tipos`
--

CREATE TABLE `salario_tipos` (
  `id` int(2) NOT NULL,
  `nome` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `selecao_publica`
--

CREATE TABLE `selecao_publica` (
  `sp_id` int(10) NOT NULL,
  `sp_cnpj` varchar(18) NOT NULL,
  `sp_razao_social` varchar(100) NOT NULL,
  `sp_fantasia` varchar(60) NOT NULL,
  `sp_email_primario` varchar(100) NOT NULL,
  `sp_resp_processo` varchar(60) NOT NULL,
  `sp_fone_cel1` varchar(13) NOT NULL,
  `sp_fone_fixo1` varchar(12) NOT NULL,
  `sp_logo` varchar(100) DEFAULT NULL,
  `sp_user_cad` varchar(50) NOT NULL,
  `sp_dt_cad` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `selecao_publica_docs`
--

CREATE TABLE `selecao_publica_docs` (
  `spd_id` int(10) NOT NULL,
  `spd_id_processo` int(10) NOT NULL,
  `spd_nome` varchar(100) NOT NULL,
  `spd_arquivo` varchar(250) NOT NULL,
  `spd_dt_cad` datetime NOT NULL,
  `spd_user_cad` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `selecao_publica_inscritos`
--

CREATE TABLE `selecao_publica_inscritos` (
  `spi_id` int(10) NOT NULL,
  `spi_nome_civil` varchar(250) NOT NULL,
  `spi_nome_social` varchar(250) DEFAULT NULL,
  `spi_idade` int(11) DEFAULT NULL,
  `spi_nota` decimal(5,0) DEFAULT NULL,
  `spi_id_processo` int(10) NOT NULL,
  `spi_id_emp` int(10) NOT NULL DEFAULT 1091,
  `spi_email` varchar(150) NOT NULL,
  `spi_senha_open` varchar(32) DEFAULT NULL,
  `spi_senha` varchar(32) NOT NULL,
  `spi_rg` varchar(30) NOT NULL,
  `spi_cpf` varchar(14) NOT NULL,
  `spi_nascto` date NOT NULL,
  `spi_localidade` varchar(1) DEFAULT NULL,
  `spi_ie` int(5) NOT NULL,
  `spi_semestre_atual` varchar(9) DEFAULT NULL,
  `spi_celular1` varchar(13) NOT NULL,
  `spi_celular2` varchar(13) DEFAULT NULL,
  `spi_cep` varchar(10) DEFAULT NULL,
  `spi_endereco` varchar(255) DEFAULT NULL,
  `spi_bairro` varchar(50) DEFAULT NULL,
  `spi_cidade` varchar(50) DEFAULT NULL,
  `spi_uf` varchar(2) DEFAULT NULL,
  `spi_numero` varchar(10) DEFAULT NULL,
  `spi_complemento` varchar(100) DEFAULT NULL,
  `spi_ibge` varchar(20) DEFAULT NULL,
  `spi_autodeclaracao_cor` int(1) NOT NULL,
  `spi_autodeclaracao_arquivo` varchar(250) DEFAULT NULL,
  `spi_doc_cor` varchar(1) DEFAULT NULL COMMENT 'resultado da analise do documento',
  `spi_autodeclaracao_pcd` int(1) DEFAULT NULL,
  `spi_autodeclaracao_pcd_arquivo` varchar(250) DEFAULT NULL,
  `spi_doc_pcd` varchar(1) DEFAULT NULL COMMENT 'resultado da analise do documento',
  `spi_dt_public_classif` date DEFAULT NULL,
  `spi_dt_cad` datetime DEFAULT NULL,
  `spi_dt_edit` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `selecao_publica_inscritos_PS2`
--

CREATE TABLE `selecao_publica_inscritos_PS2` (
  `spi_id` int(10) NOT NULL,
  `spi_nome_civil` varchar(250) NOT NULL,
  `spi_nome_social` varchar(250) DEFAULT NULL,
  `spi_idade` int(11) DEFAULT NULL,
  `spi_nota` decimal(5,0) DEFAULT NULL,
  `spi_id_processo` int(10) NOT NULL,
  `spi_id_emp` int(10) NOT NULL DEFAULT 1091,
  `spi_email` varchar(150) NOT NULL,
  `spi_senha_open` varchar(32) DEFAULT NULL,
  `spi_senha` varchar(32) NOT NULL,
  `spi_rg` varchar(30) NOT NULL,
  `spi_cpf` varchar(14) NOT NULL,
  `spi_nascto` date NOT NULL,
  `spi_localidade` varchar(1) DEFAULT NULL,
  `spi_ie` int(5) NOT NULL,
  `spi_semestre_atual` varchar(9) DEFAULT NULL,
  `spi_celular1` varchar(13) NOT NULL,
  `spi_celular2` varchar(13) DEFAULT NULL,
  `spi_cep` varchar(10) DEFAULT NULL,
  `spi_endereco` varchar(255) DEFAULT NULL,
  `spi_bairro` varchar(50) DEFAULT NULL,
  `spi_cidade` varchar(50) DEFAULT NULL,
  `spi_uf` varchar(2) DEFAULT NULL,
  `spi_numero` varchar(10) DEFAULT NULL,
  `spi_complemento` varchar(100) DEFAULT NULL,
  `spi_ibge` varchar(20) DEFAULT NULL,
  `spi_autodeclaracao_cor` int(1) NOT NULL,
  `spi_autodeclaracao_arquivo` varchar(250) DEFAULT NULL,
  `spi_autodeclaracao_pcd` int(1) DEFAULT NULL,
  `spi_autodeclaracao_pcd_arquivo` varchar(250) DEFAULT NULL,
  `spi_dt_public_classif` date DEFAULT NULL,
  `spi_dt_cad` datetime DEFAULT NULL,
  `spi_dt_edit` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `selecao_publica_inscritos_PS3`
--

CREATE TABLE `selecao_publica_inscritos_PS3` (
  `spi_id` int(10) NOT NULL,
  `spi_nome_civil` varchar(250) NOT NULL,
  `spi_nome_social` varchar(250) DEFAULT NULL,
  `spi_idade` int(11) DEFAULT NULL,
  `spi_nota` decimal(5,0) DEFAULT NULL,
  `spi_id_processo` int(10) NOT NULL,
  `spi_id_emp` int(10) NOT NULL DEFAULT 1091,
  `spi_email` varchar(150) NOT NULL,
  `spi_senha_open` varchar(32) DEFAULT NULL,
  `spi_senha` varchar(32) NOT NULL,
  `spi_rg` varchar(30) NOT NULL,
  `spi_cpf` varchar(14) NOT NULL,
  `spi_nascto` date NOT NULL,
  `spi_localidade` varchar(1) DEFAULT NULL,
  `spi_ie` int(5) NOT NULL,
  `spi_semestre_atual` varchar(9) DEFAULT NULL,
  `spi_celular1` varchar(13) NOT NULL,
  `spi_celular2` varchar(13) DEFAULT NULL,
  `spi_cep` varchar(10) DEFAULT NULL,
  `spi_endereco` varchar(255) DEFAULT NULL,
  `spi_bairro` varchar(50) DEFAULT NULL,
  `spi_cidade` varchar(50) DEFAULT NULL,
  `spi_uf` varchar(2) DEFAULT NULL,
  `spi_numero` varchar(10) DEFAULT NULL,
  `spi_complemento` varchar(100) DEFAULT NULL,
  `spi_ibge` varchar(20) DEFAULT NULL,
  `spi_autodeclaracao_cor` int(1) NOT NULL,
  `spi_autodeclaracao_arquivo` varchar(250) DEFAULT NULL,
  `spi_autodeclaracao_pcd` int(1) DEFAULT NULL,
  `spi_autodeclaracao_pcd_arquivo` varchar(250) DEFAULT NULL,
  `spi_dt_public_classif` date DEFAULT NULL,
  `spi_dt_cad` datetime DEFAULT NULL,
  `spi_dt_edit` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `selecao_publica_notas_2026_1`
--

CREATE TABLE `selecao_publica_notas_2026_1` (
  `spi_id` int(10) NOT NULL,
  `spi_nome_civil` varchar(250) NOT NULL,
  `spi_nome_social` varchar(250) DEFAULT NULL,
  `spi_idade` int(11) DEFAULT NULL,
  `spi_nota` decimal(5,0) DEFAULT NULL,
  `spi_id_processo` int(10) NOT NULL,
  `spi_id_emp` int(10) NOT NULL DEFAULT 1091,
  `spi_email` varchar(150) NOT NULL,
  `spi_senha_open` varchar(32) DEFAULT NULL,
  `spi_senha` varchar(32) NOT NULL,
  `spi_rg` varchar(30) NOT NULL,
  `spi_cpf` varchar(14) NOT NULL,
  `spi_nascto` date NOT NULL,
  `spi_localidade` varchar(1) DEFAULT NULL,
  `spi_ie` int(5) NOT NULL,
  `spi_semestre_atual` varchar(9) DEFAULT NULL,
  `spi_celular1` varchar(13) NOT NULL,
  `spi_celular2` varchar(13) DEFAULT NULL,
  `spi_cep` varchar(10) DEFAULT NULL,
  `spi_endereco` varchar(255) DEFAULT NULL,
  `spi_bairro` varchar(50) DEFAULT NULL,
  `spi_cidade` varchar(50) DEFAULT NULL,
  `spi_uf` varchar(2) DEFAULT NULL,
  `spi_numero` varchar(10) DEFAULT NULL,
  `spi_complemento` varchar(100) DEFAULT NULL,
  `spi_ibge` varchar(20) DEFAULT NULL,
  `spi_autodeclaracao_cor` int(1) NOT NULL,
  `spi_autodeclaracao_arquivo` varchar(250) DEFAULT NULL,
  `spi_autodeclaracao_pcd` int(1) DEFAULT NULL,
  `spi_autodeclaracao_pcd_arquivo` varchar(250) DEFAULT NULL,
  `spi_dt_public_classif` date DEFAULT NULL,
  `spi_dt_cad` datetime DEFAULT NULL,
  `spi_dt_edit` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `selecao_publica_processos`
--

CREATE TABLE `selecao_publica_processos` (
  `spp_id` int(10) NOT NULL,
  `spp_id_orgao` int(10) NOT NULL,
  `spp_nr_edital` varchar(10) NOT NULL,
  `spp_url_inscricao` varchar(255) DEFAULT NULL,
  `spp_dt_inscr_ini` date NOT NULL,
  `spp_dt_inscr_fim` date NOT NULL,
  `spp_beneficios` longtext NOT NULL,
  `spp_status` int(1) NOT NULL DEFAULT 1,
  `spp_ch_estagio` varchar(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `servicos_contratados_emp`
--

CREATE TABLE `servicos_contratados_emp` (
  `sce_id` int(10) NOT NULL,
  `sce_id_emp` int(10) NOT NULL,
  `sce_id_ctt_emp` int(10) NOT NULL,
  `sce_id_curso` int(10) NOT NULL,
  `sce_user_cad` varchar(40) NOT NULL,
  `sce_user_edit` varchar(40) NOT NULL,
  `sce_dt_cad` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `sexo`
--

CREATE TABLE `sexo` (
  `sexo_id` int(5) NOT NULL,
  `sexo_sexo` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `status_aluno`
--

CREATE TABLE `status_aluno` (
  `stt_id` int(2) NOT NULL,
  `stt_status` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `status_curso`
--

CREATE TABLE `status_curso` (
  `stt_id` int(2) NOT NULL,
  `stt_status` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `status_frequencia`
--

CREATE TABLE `status_frequencia` (
  `stt_pf_id` int(10) NOT NULL,
  `stt_pf_status` varchar(50) NOT NULL,
  `stt_pf_data_cad` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `status_frequencia_horario`
--

CREATE TABLE `status_frequencia_horario` (
  `stt_freq_hor_id` int(10) NOT NULL,
  `stt_freq_hor_status` varchar(50) NOT NULL,
  `stt_freq_hor_data_cad` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `status_mensalidade`
--

CREATE TABLE `status_mensalidade` (
  `stt_mens_id` int(5) NOT NULL,
  `stt_mens_status` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `status_requerimento`
--

CREATE TABLE `status_requerimento` (
  `stt_req_id` int(2) NOT NULL,
  `stt_req_status` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tabela_preco_cursos`
--

CREATE TABLE `tabela_preco_cursos` (
  `tpc_id` int(10) NOT NULL,
  `tpc_id_curso` int(5) NOT NULL,
  `tpc_id_unidade` int(1) NOT NULL,
  `tpc_perfil_contrato` varchar(10) DEFAULT NULL,
  `tpc_detalhe` longtext DEFAULT NULL,
  `tpc_valor_total` decimal(10,2) NOT NULL,
  `tpc_valor_total_ext` longtext DEFAULT NULL,
  `tpc_dt_validade` date DEFAULT NULL,
  `tpc_status` int(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tetra_atividades`
--

CREATE TABLE `tetra_atividades` (
  `tp_id` int(11) NOT NULL,
  `tp_atividade` longtext NOT NULL,
  `tp_letra` varchar(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tetra_respostas`
--

CREATE TABLE `tetra_respostas` (
  `tr_id` int(10) NOT NULL,
  `tr_id_aluno` int(10) NOT NULL,
  `tr_id_contrato` int(10) NOT NULL,
  `tr_valid` int(1) NOT NULL DEFAULT 0,
  `tr_a` int(2) NOT NULL,
  `tr_t` int(2) NOT NULL,
  `tr_g` int(2) NOT NULL,
  `tr_f` int(2) NOT NULL,
  `tr_1` varchar(1) NOT NULL,
  `tr_2` varchar(1) NOT NULL,
  `tr_3` varchar(1) NOT NULL,
  `tr_4` varchar(1) NOT NULL,
  `tr_5` varchar(1) NOT NULL,
  `tr_6` varchar(1) NOT NULL,
  `tr_7` varchar(1) NOT NULL,
  `tr_8` varchar(1) NOT NULL,
  `tr_9` varchar(1) NOT NULL,
  `tr_10` varchar(1) NOT NULL,
  `tr_11` varchar(1) NOT NULL,
  `tr_12` varchar(1) NOT NULL,
  `tr_13` varchar(1) NOT NULL,
  `tr_14` varchar(1) NOT NULL,
  `tr_15` varchar(1) NOT NULL,
  `tr_16` varchar(1) NOT NULL,
  `tr_17` varchar(1) NOT NULL,
  `tr_18` varchar(1) NOT NULL,
  `tr_19` varchar(1) NOT NULL,
  `tr_20` varchar(1) NOT NULL,
  `tr_21` varchar(1) NOT NULL,
  `tr_22` varchar(1) NOT NULL,
  `tr_23` varchar(1) NOT NULL,
  `tr_24` varchar(1) NOT NULL,
  `tr_25` varchar(1) NOT NULL,
  `tr_26` varchar(1) NOT NULL,
  `tr_27` varchar(1) NOT NULL,
  `tr_28` varchar(1) NOT NULL,
  `tr_29` varchar(1) NOT NULL,
  `tr_30` varchar(1) NOT NULL,
  `tr_31` varchar(1) NOT NULL,
  `tr_32` varchar(1) NOT NULL,
  `tr_33` varchar(1) NOT NULL,
  `tr_34` varchar(1) NOT NULL,
  `tr_35` varchar(1) NOT NULL,
  `tr_36` varchar(1) NOT NULL,
  `tr_37` varchar(1) NOT NULL,
  `tr_38` varchar(1) NOT NULL,
  `tr_39` varchar(1) NOT NULL,
  `tr_40` varchar(1) NOT NULL,
  `tr_41` varchar(1) NOT NULL,
  `tr_42` varchar(1) NOT NULL,
  `tr_43` varchar(1) NOT NULL,
  `tr_44` varchar(1) NOT NULL,
  `tr_45` varchar(1) NOT NULL,
  `tr_46` varchar(1) NOT NULL,
  `tr_47` varchar(1) NOT NULL,
  `tr_48` varchar(1) NOT NULL,
  `tr_49` varchar(1) NOT NULL,
  `tr_50` varchar(1) NOT NULL,
  `tr_51` varchar(1) NOT NULL,
  `tr_52` varchar(1) NOT NULL,
  `tr_53` varchar(1) NOT NULL,
  `tr_54` varchar(1) NOT NULL,
  `tr_55` varchar(1) NOT NULL,
  `tr_56` varchar(1) NOT NULL,
  `tr_57` varchar(1) NOT NULL,
  `tr_58` varchar(1) NOT NULL,
  `tr_59` varchar(1) NOT NULL,
  `tr_60` varchar(1) NOT NULL,
  `tr_61` varchar(1) NOT NULL,
  `tr_62` varchar(1) NOT NULL,
  `tr_63` varchar(1) NOT NULL,
  `tr_64` varchar(1) NOT NULL,
  `tr_65` varchar(1) NOT NULL,
  `tr_66` varchar(1) NOT NULL,
  `tr_67` varchar(1) NOT NULL,
  `tr_68` varchar(1) NOT NULL,
  `tr_69` varchar(1) NOT NULL,
  `tr_70` varchar(1) NOT NULL,
  `tr_71` varchar(1) NOT NULL,
  `tr_72` varchar(1) NOT NULL,
  `tr_73` varchar(1) NOT NULL,
  `tr_74` varchar(1) NOT NULL,
  `tr_75` varchar(1) NOT NULL,
  `tr_76` varchar(1) NOT NULL,
  `tr_77` varchar(1) NOT NULL,
  `tr_78` varchar(1) NOT NULL,
  `tr_79` varchar(1) NOT NULL,
  `tr_80` varchar(1) NOT NULL,
  `tr_81` varchar(1) NOT NULL,
  `tr_user_cad` varchar(50) NOT NULL,
  `tr_dt_liberado` date DEFAULT NULL,
  `tr_dt_cad` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `uf`
--

CREATE TABLE `uf` (
  `uf_id` int(2) NOT NULL,
  `uf_cidade` varchar(13) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `unidades_proativa`
--

CREATE TABLE `unidades_proativa` (
  `up_id` int(5) NOT NULL,
  `up_razao_social` varchar(100) DEFAULT NULL,
  `up_fantasia` varchar(50) DEFAULT NULL,
  `up_cnpj` varchar(18) DEFAULT NULL,
  `up_endereco` varchar(100) DEFAULT NULL,
  `up_bairro` varchar(50) DEFAULT NULL,
  `up_sigla_local` varchar(3) NOT NULL,
  `up_cidade` varchar(50) DEFAULT NULL,
  `up_uf` varchar(2) DEFAULT NULL,
  `up_cep` varchar(8) DEFAULT NULL,
  `up_fone` varchar(15) DEFAULT NULL,
  `up_rep_legal` varchar(60) DEFAULT NULL,
  `up_cargo` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `user_sistema`
--

CREATE TABLE `user_sistema` (
  `usu_id` int(10) NOT NULL,
  `usu_nome` varchar(60) NOT NULL,
  `usu_email` varchar(100) NOT NULL,
  `usu_login` varchar(30) NOT NULL,
  `usu_senha` varchar(32) NOT NULL,
  `usu_nivel` varchar(20) NOT NULL,
  `usu_rg` varchar(20) DEFAULT NULL,
  `usu_cpf` varchar(15) DEFAULT NULL,
  `usu_unidade` int(2) DEFAULT NULL,
  `usu_depto` varchar(50) NOT NULL,
  `usu_hr_ini_seg` time DEFAULT NULL,
  `usu_hr_fim_seg` time DEFAULT NULL,
  `usu_hr_ini_ter` time DEFAULT NULL,
  `usu_hr_fim_ter` time DEFAULT NULL,
  `usu_hr_ini_qua` time DEFAULT NULL,
  `usu_hr_fim_qua` time DEFAULT NULL,
  `usu_hr_ini_qui` time DEFAULT NULL,
  `usu_hr_fim_qui` time DEFAULT NULL,
  `usu_hr_ini_sex` time DEFAULT NULL,
  `usu_hr_fim_sex` time DEFAULT NULL,
  `usu_hr_ini_sab` time DEFAULT NULL,
  `usu_hr_fim_sab` time DEFAULT NULL,
  `usu_hr_ini_dom` time DEFAULT NULL,
  `usu_hr_fim_dom` time DEFAULT NULL,
  `usu_data_cad` timestamp NOT NULL DEFAULT current_timestamp(),
  `usu_user_appa` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `vaga_comentario_vaga`
--

CREATE TABLE `vaga_comentario_vaga` (
  `vcv_id` int(10) NOT NULL,
  `vcv_id_vaga` int(10) NOT NULL,
  `vcv_obs` longtext NOT NULL,
  `vcv_dt_cad` datetime NOT NULL,
  `vcv_user_cad` varchar(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `vaga_site`
--

CREATE TABLE `vaga_site` (
  `vs_id` int(10) NOT NULL,
  `vs_id_emp` int(10) NOT NULL,
  `vs_id_resp_proc` int(10) DEFAULT NULL,
  `vs_area` varchar(30) NOT NULL,
  `vs_sexo` varchar(1) NOT NULL,
  `vs_idade_ini` int(2) NOT NULL,
  `vs_idade_fim` int(2) NOT NULL,
  `vs_entrevistador` varchar(80) DEFAULT NULL,
  `vs_bairro` varchar(50) NOT NULL,
  `vs_cidade_vaga` varchar(50) DEFAULT NULL,
  `vs_atividades` longtext NOT NULL,
  `vs_perfil_vaga` varchar(20) DEFAULT NULL,
  `vs_hr_ini` time DEFAULT NULL,
  `vs_hr_fim` time DEFAULT NULL,
  `vs_hr_ini2` time DEFAULT NULL,
  `vs_hr_fim2` time DEFAULT NULL,
  `vs_id_ne` int(1) DEFAULT NULL COMMENT 'NE = nivel educacional',
  `vs_curso` varchar(50) DEFAULT NULL,
  `vs_semestre` varchar(20) NOT NULL,
  `vs_valor_bolsa` decimal(10,2) DEFAULT NULL,
  `vs_vale_transp` int(1) DEFAULT NULL,
  `vs_vale_aliment` decimal(10,2) DEFAULT NULL,
  `vs_dt_hora_entrevista` datetime DEFAULT NULL COMMENT 'comparecer na empresa',
  `vs_dt_hora_entrevista_proa` datetime DEFAULT NULL COMMENT 'comparecer na proativa',
  `vs_status` int(1) NOT NULL DEFAULT 0 COMMENT 'VIA CRON, OCULTA VAGA NO SITE PELA DATA DE VALIDADE',
  `vs_status_processo` int(1) NOT NULL DEFAULT 0,
  `vs_dt_vecto` date DEFAULT NULL,
  `vs_qtde` int(5) DEFAULT NULL,
  `vs_dt_cad` datetime NOT NULL,
  `vs_user_cad` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `vaga_site_atendimentos`
--

CREATE TABLE `vaga_site_atendimentos` (
  `vsa_id` int(10) NOT NULL,
  `vsa_id_aluno` int(10) NOT NULL,
  `vsa_id_vaga` int(10) NOT NULL,
  `vsa_obs` longtext NOT NULL,
  `vsa_dt_cad` datetime NOT NULL,
  `vsa_user_cad` varchar(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `vaga_site_candidatos_participantes`
--

CREATE TABLE `vaga_site_candidatos_participantes` (
  `vscp_id` int(10) NOT NULL,
  `vscp_id_vaga` int(10) NOT NULL,
  `vscp_id_emp` int(10) NOT NULL,
  `vscp_id_candidato` int(10) NOT NULL,
  `vscp_id_ie` int(10) DEFAULT NULL COMMENT 'IE atual do candidato na candidatura',
  `vscp_id_nivel` int(10) DEFAULT NULL COMMENT 'nivel educacional',
  `vscp_id_curso` int(10) DEFAULT NULL,
  `vscp_id_pv` int(1) DEFAULT NULL COMMENT 'PV = perfil da vaga',
  `vscp_ie_data` varchar(100) DEFAULT NULL COMMENT 'aluno informa manualmente IE quando  nao cadastrada',
  `vscp_curso_data` varchar(60) DEFAULT NULL COMMENT 'aluno informa manualmente Curso quando nao cadastrado',
  `vscp_tipo_candidato` varchar(1) NOT NULL,
  `vscp_dt_entrevista` datetime DEFAULT NULL COMMENT 'descontinuado em 27.02.2026',
  `vscp_local_entrevista` varchar(250) DEFAULT NULL COMMENT 'end. proativa',
  `vscp_dt_entrevista_ind` datetime DEFAULT NULL COMMENT 'base para relatorio de encaminhados p entrevista',
  `vscp_local_entrevista_ind` varchar(250) DEFAULT NULL COMMENT 'end. da empresa',
  `vscp_entrevistador` varchar(80) DEFAULT NULL,
  `vscp_maps` varchar(100) DEFAULT NULL,
  `vscp_tipo_ps` varchar(8) DEFAULT NULL COMMENT 'carta encam. direto ou indireto (descontinuado em 26.02.26)',
  `vscp_status` int(1) NOT NULL DEFAULT 4,
  `vscp_motivo_desist` varchar(250) DEFAULT NULL,
  `vscp_dt_desist` date DEFAULT NULL COMMENT 'data da desistencia ou ausencia injustificada',
  `vscp_cad_user` varchar(50) NOT NULL,
  `vscp_dt_cad` datetime NOT NULL,
  `vscp_dt_edit` datetime DEFAULT NULL,
  `vscp_user_edit` varchar(60) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `validadar_empresas`
--

CREATE TABLE `validadar_empresas` (
  `valid_emp_id` int(10) NOT NULL,
  `key_id_empresa` int(10) NOT NULL,
  `valid_emp_empresa` varchar(200) NOT NULL,
  `valid_emp_data` timestamp NOT NULL DEFAULT current_timestamp(),
  `valid_emp_user_appa` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `validar_disciplinas`
--

CREATE TABLE `validar_disciplinas` (
  `valid_disc_id` int(10) NOT NULL,
  `valid_disc_disciplina` varchar(300) NOT NULL,
  `valid_disc_id_disciplina` int(10) NOT NULL,
  `valid_disc_data_cad` timestamp NOT NULL DEFAULT current_timestamp(),
  `valid_disc_user_appa` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `visita_serv_social_emp`
--

CREATE TABLE `visita_serv_social_emp` (
  `vsse_id` int(10) NOT NULL,
  `vsse_id_emp` int(10) NOT NULL,
  `vsse_dt_agendada` date NOT NULL,
  `vsse_user_cad` varchar(50) NOT NULL,
  `vsse_dt_cad` datetime NOT NULL,
  `vsse_obs` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Estrutura stand-in para view `vw_meses`
-- (Veja abaixo para a visão atual)
--
CREATE TABLE `vw_meses` (
`mes` int(3)
);

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `alunos`
--
ALTER TABLE `alunos`
  ADD PRIMARY KEY (`alu_id`);

--
-- Índices de tabela `alunos_pre_cad_periodo`
--
ALTER TABLE `alunos_pre_cad_periodo`
  ADD PRIMARY KEY (`apcp_id`);

--
-- Índices de tabela `alunos_pre_cad_turno`
--
ALTER TABLE `alunos_pre_cad_turno`
  ADD PRIMARY KEY (`apct_id`);

--
-- Índices de tabela `analisa_doc`
--
ALTER TABLE `analisa_doc`
  ADD PRIMARY KEY (`ad_id`);

--
-- Índices de tabela `anexos_docs_cursos`
--
ALTER TABLE `anexos_docs_cursos`
  ADD PRIMARY KEY (`adc_id`);

--
-- Índices de tabela `anexos_docs_ie`
--
ALTER TABLE `anexos_docs_ie`
  ADD PRIMARY KEY (`adie_id`);

--
-- Índices de tabela `ano`
--
ALTER TABLE `ano`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `atendimento`
--
ALTER TABLE `atendimento`
  ADD PRIMARY KEY (`atd_id`);

--
-- Índices de tabela `atendimento_emp`
--
ALTER TABLE `atendimento_emp`
  ADD PRIMARY KEY (`atd_emp_id`);

--
-- Índices de tabela `atendimento_ie`
--
ALTER TABLE `atendimento_ie`
  ADD PRIMARY KEY (`atd_ie_id`);

--
-- Índices de tabela `atendimento_notifica_emp`
--
ALTER TABLE `atendimento_notifica_emp`
  ADD PRIMARY KEY (`ane_id`);

--
-- Índices de tabela `atendimento_setor`
--
ALTER TABLE `atendimento_setor`
  ADD PRIMARY KEY (`atd_str_id`);

--
-- Índices de tabela `aviso_falta_aluno`
--
ALTER TABLE `aviso_falta_aluno`
  ADD PRIMARY KEY (`afa_id`);

--
-- Índices de tabela `bancos`
--
ALTER TABLE `bancos`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `banco_pix`
--
ALTER TABLE `banco_pix`
  ADD PRIMARY KEY (`p_id`);

--
-- Índices de tabela `banco_tipo_contas`
--
ALTER TABLE `banco_tipo_contas`
  ADD PRIMARY KEY (`bt_id`);

--
-- Índices de tabela `boletos_alunos`
--
ALTER TABLE `boletos_alunos`
  ADD PRIMARY KEY (`ba_id`);

--
-- Índices de tabela `boletos_nfs_empresas`
--
ALTER TABLE `boletos_nfs_empresas`
  ADD PRIMARY KEY (`bn_id`);

--
-- Índices de tabela `cad_aluno_ead`
--
ALTER TABLE `cad_aluno_ead`
  ADD PRIMARY KEY (`cad_id`);

--
-- Índices de tabela `calendario_10_porcento`
--
ALTER TABLE `calendario_10_porcento`
  ADD PRIMARY KEY (`c10p_id`);

--
-- Índices de tabela `candidato_habilidade`
--
ALTER TABLE `candidato_habilidade`
  ADD PRIMARY KEY (`ch_id`);

--
-- Índices de tabela `candidato_tipo_vaga`
--
ALTER TABLE `candidato_tipo_vaga`
  ADD PRIMARY KEY (`ctv_id`);

--
-- Índices de tabela `certidoes_appa`
--
ALTER TABLE `certidoes_appa`
  ADD PRIMARY KEY (`cert_id`);

--
-- Índices de tabela `certidoes_tipos`
--
ALTER TABLE `certidoes_tipos`
  ADD PRIMARY KEY (`cert_tipo_id`);

--
-- Índices de tabela `chamado`
--
ALTER TABLE `chamado`
  ADD PRIMARY KEY (`id`),
  ADD KEY `c_id` (`c_id`),
  ADD KEY `idx_c_depto_destino` (`c_depto_destino`),
  ADD KEY `idx_c_cham_fechado` (`c_cham_fechado`),
  ADD KEY `idx_c_dt_cad` (`c_dt_cad`);

--
-- Índices de tabela `chamado_interacoes`
--
ALTER TABLE `chamado_interacoes`
  ADD PRIMARY KEY (`ci_id_controle`);

--
-- Índices de tabela `conhecimento_informatica`
--
ALTER TABLE `conhecimento_informatica`
  ADD PRIMARY KEY (`conh_inf_id`);

--
-- Índices de tabela `contrato_aluno`
--
ALTER TABLE `contrato_aluno`
  ADD PRIMARY KEY (`ctt_alu_id`),
  ADD KEY `idx_ctt_alu_id` (`ctt_alu_id`),
  ADD KEY `idx_ctt_id_emp` (`ctt_id_emp`),
  ADD KEY `idx_ctt_id_segmento` (`ctt_id_segmento`),
  ADD KEY `idx_ctt_alu_dt_ini` (`ctt_alu_dt_ini`),
  ADD KEY `idx_ctt_alu_dt_fim` (`ctt_alu_dt_fim`),
  ADD KEY `idx_ctt_alu_dt_desligamento` (`ctt_alu_dt_desligamento`);

--
-- Índices de tabela `contrato_aluno_aditivo`
--
ALTER TABLE `contrato_aluno_aditivo`
  ADD PRIMARY KEY (`caa_id`);

--
-- Índices de tabela `contrato_aluno_reducao_ch`
--
ALTER TABLE `contrato_aluno_reducao_ch`
  ADD PRIMARY KEY (`carch_id`);

--
-- Índices de tabela `contrato_aluno_tst`
--
ALTER TABLE `contrato_aluno_tst`
  ADD PRIMARY KEY (`ctt_alu_id`);

--
-- Índices de tabela `contrato_empresa`
--
ALTER TABLE `contrato_empresa`
  ADD PRIMARY KEY (`cte_id`);

--
-- Índices de tabela `contrato_motivo_canc`
--
ALTER TABLE `contrato_motivo_canc`
  ADD PRIMARY KEY (`cmc_id`);

--
-- Índices de tabela `contrato_motivo_susp`
--
ALTER TABLE `contrato_motivo_susp`
  ADD PRIMARY KEY (`cms_id`);

--
-- Índices de tabela `cron_status`
--
ALTER TABLE `cron_status`
  ADD PRIMARY KEY (`cs_id`);

--
-- Índices de tabela `curso`
--
ALTER TABLE `curso`
  ADD PRIMARY KEY (`curso_id`);

--
-- Índices de tabela `curso_appa`
--
ALTER TABLE `curso_appa`
  ADD PRIMARY KEY (`curappa_id`);

--
-- Índices de tabela `curso_appa_cbo`
--
ALTER TABLE `curso_appa_cbo`
  ADD PRIMARY KEY (`cac_id`);

--
-- Índices de tabela `curso_dias_aulas`
--
ALTER TABLE `curso_dias_aulas`
  ADD PRIMARY KEY (`cda_id`);

--
-- Índices de tabela `curso_dia_hora_aula`
--
ALTER TABLE `curso_dia_hora_aula`
  ADD PRIMARY KEY (`cda_id`);

--
-- Índices de tabela `curso_dia_retorno`
--
ALTER TABLE `curso_dia_retorno`
  ADD PRIMARY KEY (`cdr_id`);

--
-- Índices de tabela `curso_horarios`
--
ALTER TABLE `curso_horarios`
  ADD PRIMARY KEY (`ch_id`);

--
-- Índices de tabela `curso_segmento`
--
ALTER TABLE `curso_segmento`
  ADD PRIMARY KEY (`seg_id`);

--
-- Índices de tabela `dados_ava_covid19`
--
ALTER TABLE `dados_ava_covid19`
  ADD PRIMARY KEY (`dac_id`);

--
-- Índices de tabela `data_aula`
--
ALTER TABLE `data_aula`
  ADD PRIMARY KEY (`da_id`);

--
-- Índices de tabela `debito_carta_cob`
--
ALTER TABLE `debito_carta_cob`
  ADD PRIMARY KEY (`dcc_id`);

--
-- Índices de tabela `debito_notif_extra_judicial`
--
ALTER TABLE `debito_notif_extra_judicial`
  ADD PRIMARY KEY (`dnej_id`);

--
-- Índices de tabela `demandas_email`
--
ALTER TABLE `demandas_email`
  ADD PRIMARY KEY (`de_id`);

--
-- Índices de tabela `demandas_tarefas`
--
ALTER TABLE `demandas_tarefas`
  ADD PRIMARY KEY (`dt_id`);

--
-- Índices de tabela `demandas_tipo`
--
ALTER TABLE `demandas_tipo`
  ADD PRIMARY KEY (`dt_id`);

--
-- Índices de tabela `diario_visitas`
--
ALTER TABLE `diario_visitas`
  ADD PRIMARY KEY (`dv_id`);

--
-- Índices de tabela `dia_aula_preparatorio`
--
ALTER TABLE `dia_aula_preparatorio`
  ADD PRIMARY KEY (`dap_id`);

--
-- Índices de tabela `dia_retorno_aula_apdz`
--
ALTER TABLE `dia_retorno_aula_apdz`
  ADD PRIMARY KEY (`ret_id`);

--
-- Índices de tabela `disciplinas`
--
ALTER TABLE `disciplinas`
  ADD PRIMARY KEY (`disc_id`);

--
-- Índices de tabela `disciplinas_vinculos_prof`
--
ALTER TABLE `disciplinas_vinculos_prof`
  ADD PRIMARY KEY (`dvp_id`);

--
-- Índices de tabela `disponibilidade_horario`
--
ALTER TABLE `disponibilidade_horario`
  ADD PRIMARY KEY (`disp_hor_id`);

--
-- Índices de tabela `empresas`
--
ALTER TABLE `empresas`
  ADD PRIMARY KEY (`emp_id`);

--
-- Índices de tabela `empresas_agrupadas`
--
ALTER TABLE `empresas_agrupadas`
  ADD PRIMARY KEY (`ea_id`);

--
-- Índices de tabela `empresas_aviso_boleto`
--
ALTER TABLE `empresas_aviso_boleto`
  ADD PRIMARY KEY (`id`),
  ADD KEY `aeb_id_fatura` (`aeb_id_fatura`);

--
-- Índices de tabela `empresas_grupo`
--
ALTER TABLE `empresas_grupo`
  ADD PRIMARY KEY (`eg_id`);

--
-- Índices de tabela `empresas_restricao`
--
ALTER TABLE `empresas_restricao`
  ADD PRIMARY KEY (`re_pin`);

--
-- Índices de tabela `empresas_tst`
--
ALTER TABLE `empresas_tst`
  ADD PRIMARY KEY (`emp_id`);

--
-- Índices de tabela `envia_email_ead`
--
ALTER TABLE `envia_email_ead`
  ADD PRIMARY KEY (`ead_id`);

--
-- Índices de tabela `escolaridade`
--
ALTER TABLE `escolaridade`
  ADD PRIMARY KEY (`escol_id`);

--
-- Índices de tabela `estado_civil`
--
ALTER TABLE `estado_civil`
  ADD PRIMARY KEY (`ec_id`);

--
-- Índices de tabela `estagio_atividades`
--
ALTER TABLE `estagio_atividades`
  ADD PRIMARY KEY (`ea_id`);

--
-- Índices de tabela `estagio_atividades_31_10_2026`
--
ALTER TABLE `estagio_atividades_31_10_2026`
  ADD PRIMARY KEY (`ea_id`);

--
-- Índices de tabela `estagio_cursos`
--
ALTER TABLE `estagio_cursos`
  ADD PRIMARY KEY (`ec_id`);

--
-- Índices de tabela `estagio_estudante_vinculado`
--
ALTER TABLE `estagio_estudante_vinculado`
  ADD PRIMARY KEY (`eev_id`);

--
-- Índices de tabela `estagio_ra`
--
ALTER TABLE `estagio_ra`
  ADD PRIMARY KEY (`etra_id`);

--
-- Índices de tabela `estagio_recesso`
--
ALTER TABLE `estagio_recesso`
  ADD PRIMARY KEY (`re_id`);

--
-- Índices de tabela `estagio_seguradora`
--
ALTER TABLE `estagio_seguradora`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `estagio_supervisores`
--
ALTER TABLE `estagio_supervisores`
  ADD PRIMARY KEY (`es_id`);

--
-- Índices de tabela `estagio_tre`
--
ALTER TABLE `estagio_tre`
  ADD PRIMARY KEY (`etre_id`);

--
-- Índices de tabela `excluir_dados_bd`
--
ALTER TABLE `excluir_dados_bd`
  ADD PRIMARY KEY (`ed_id`);

--
-- Índices de tabela `facilitador`
--
ALTER TABLE `facilitador`
  ADD PRIMARY KEY (`f_id`);

--
-- Índices de tabela `facilitador_turma`
--
ALTER TABLE `facilitador_turma`
  ADD PRIMARY KEY (`ft_id`);

--
-- Índices de tabela `feriados`
--
ALTER TABLE `feriados`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `data_unica` (`data`) COMMENT 'Garante que não haja duplicidade de datas';

--
-- Índices de tabela `finan_banco`
--
ALTER TABLE `finan_banco`
  ADD PRIMARY KEY (`fb_id`);

--
-- Índices de tabela `finan_extrato`
--
ALTER TABLE `finan_extrato`
  ADD PRIMARY KEY (`e_id`),
  ADD KEY `idx_e_id_cobranca` (`e_id_cobranca`);

--
-- Índices de tabela `finan_tipo_despesa`
--
ALTER TABLE `finan_tipo_despesa`
  ADD PRIMARY KEY (`td_id`);

--
-- Índices de tabela `finan_tipo_despesa_sub`
--
ALTER TABLE `finan_tipo_despesa_sub`
  ADD PRIMARY KEY (`tds_id`);

--
-- Índices de tabela `finan_tipo_receita`
--
ALTER TABLE `finan_tipo_receita`
  ADD PRIMARY KEY (`tr_id`);

--
-- Índices de tabela `folha_pgto_emp`
--
ALTER TABLE `folha_pgto_emp`
  ADD PRIMARY KEY (`fpe_id`);

--
-- Índices de tabela `frase_motivacional_cob_emp`
--
ALTER TABLE `frase_motivacional_cob_emp`
  ADD PRIMARY KEY (`fm_id`);

--
-- Índices de tabela `frequencia`
--
ALTER TABLE `frequencia`
  ADD PRIMARY KEY (`pf_id`);

--
-- Índices de tabela `frequencia_aluno`
--
ALTER TABLE `frequencia_aluno`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `frequencia_master`
--
ALTER TABLE `frequencia_master`
  ADD PRIMARY KEY (`freq_id`);

--
-- Índices de tabela `frequencia_master_arquivo_morto`
--
ALTER TABLE `frequencia_master_arquivo_morto`
  ADD PRIMARY KEY (`freq_id`);

--
-- Índices de tabela `historico_acessos`
--
ALTER TABLE `historico_acessos`
  ADD PRIMARY KEY (`ace_id`);

--
-- Índices de tabela `historico_acessos_alu`
--
ALTER TABLE `historico_acessos_alu`
  ADD PRIMARY KEY (`ace_id`);

--
-- Índices de tabela `historico_acessos_emp`
--
ALTER TABLE `historico_acessos_emp`
  ADD PRIMARY KEY (`ace_id`);

--
-- Índices de tabela `historico_pgto_contrato`
--
ALTER TABLE `historico_pgto_contrato`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_id_contrato` (`id_contrato`),
  ADD KEY `idx_deducao` (`deducao`),
  ADD KEY `idx_dt_ini` (`dt_ini`),
  ADD KEY `idx_dt_fim` (`dt_fim`),
  ADD KEY `idx_dt_deslig` (`dt_deslig`),
  ADD KEY `idx_competencia` (`competencia`);

--
-- Índices de tabela `historico_pgto_empresas`
--
ALTER TABLE `historico_pgto_empresas`
  ADD PRIMARY KEY (`hpe_id`),
  ADD KEY `idx_hpe_reg_fluxo_cx` (`hpe_reg_fluxo_cx`);

--
-- Índices de tabela `instituicao_ensino`
--
ALTER TABLE `instituicao_ensino`
  ADD PRIMARY KEY (`ie_id`);

--
-- Índices de tabela `instituicao_ensino_curso`
--
ALTER TABLE `instituicao_ensino_curso`
  ADD PRIMARY KEY (`iec_id`);

--
-- Índices de tabela `instituicao_ensino_curso_base`
--
ALTER TABLE `instituicao_ensino_curso_base`
  ADD PRIMARY KEY (`iecb_id`);

--
-- Índices de tabela `instituicao_ensino_nivel`
--
ALTER TABLE `instituicao_ensino_nivel`
  ADD PRIMARY KEY (`ien_id`);

--
-- Índices de tabela `instituicao_ensino_resp_estagio`
--
ALTER TABLE `instituicao_ensino_resp_estagio`
  ADD PRIMARY KEY (`iere_id`);

--
-- Índices de tabela `instituicao_periodo`
--
ALTER TABLE `instituicao_periodo`
  ADD PRIMARY KEY (`iep_id`);

--
-- Índices de tabela `jornada_estagio`
--
ALTER TABLE `jornada_estagio`
  ADD PRIMARY KEY (`je_id`);

--
-- Índices de tabela `jornada_trab_pratica`
--
ALTER TABLE `jornada_trab_pratica`
  ADD PRIMARY KEY (`jtp_id`);

--
-- Índices de tabela `jornada_trab_teorica`
--
ALTER TABLE `jornada_trab_teorica`
  ADD PRIMARY KEY (`jtt_id`);

--
-- Índices de tabela `justificar_falta`
--
ALTER TABLE `justificar_falta`
  ADD PRIMARY KEY (`jf_id`);

--
-- Índices de tabela `justifica_frequencia`
--
ALTER TABLE `justifica_frequencia`
  ADD PRIMARY KEY (`just_freq_id`);

--
-- Índices de tabela `material_didatico`
--
ALTER TABLE `material_didatico`
  ADD PRIMARY KEY (`md_id`);

--
-- Índices de tabela `md_aluno_curso`
--
ALTER TABLE `md_aluno_curso`
  ADD PRIMARY KEY (`md_ac_id`),
  ADD UNIQUE KEY `md_ac_id_alocacao` (`md_ac_id_alocacao`);

--
-- Índices de tabela `mensagens_enviadas`
--
ALTER TABLE `mensagens_enviadas`
  ADD PRIMARY KEY (`me_id`);

--
-- Índices de tabela `mensagens_modelo`
--
ALTER TABLE `mensagens_modelo`
  ADD PRIMARY KEY (`mm_id`);

--
-- Índices de tabela `mesalidade`
--
ALTER TABLE `mesalidade`
  ADD PRIMARY KEY (`mens_id`);

--
-- Índices de tabela `meses`
--
ALTER TABLE `meses`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `modalidade_curso`
--
ALTER TABLE `modalidade_curso`
  ADD PRIMARY KEY (`mod_c_id`);

--
-- Índices de tabela `modalidade_empresa`
--
ALTER TABLE `modalidade_empresa`
  ADD PRIMARY KEY (`mod_emp_id`);

--
-- Índices de tabela `montar_turma`
--
ALTER TABLE `montar_turma`
  ADD PRIMARY KEY (`freq_id`);

--
-- Índices de tabela `montar_turma_base_teste`
--
ALTER TABLE `montar_turma_base_teste`
  ADD PRIMARY KEY (`freq_id`);

--
-- Índices de tabela `montar_turma_tst`
--
ALTER TABLE `montar_turma_tst`
  ADD PRIMARY KEY (`freq_id`);

--
-- Índices de tabela `nivel_educacional`
--
ALTER TABLE `nivel_educacional`
  ADD PRIMARY KEY (`ne_id`);

--
-- Índices de tabela `notas`
--
ALTER TABLE `notas`
  ADD PRIMARY KEY (`nota_id`);

--
-- Índices de tabela `notifica_aluno`
--
ALTER TABLE `notifica_aluno`
  ADD PRIMARY KEY (`na_id`);

--
-- Índices de tabela `notifica_aviso_ferias_apz`
--
ALTER TABLE `notifica_aviso_ferias_apz`
  ADD PRIMARY KEY (`nafa_id`);

--
-- Índices de tabela `notifica_ctt_nep_ser_estacio`
--
ALTER TABLE `notifica_ctt_nep_ser_estacio`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `notifica_fim_contrato`
--
ALTER TABLE `notifica_fim_contrato`
  ADD PRIMARY KEY (`nfc_id`);

--
-- Índices de tabela `notifica_seguro_estagio`
--
ALTER TABLE `notifica_seguro_estagio`
  ADD PRIMARY KEY (`nse_id`);

--
-- Índices de tabela `operadora_telefone`
--
ALTER TABLE `operadora_telefone`
  ADD PRIMARY KEY (`op_id`);

--
-- Índices de tabela `origem_cpf`
--
ALTER TABLE `origem_cpf`
  ADD PRIMARY KEY (`orig_cpf_id`);

--
-- Índices de tabela `provisionar_pgto`
--
ALTER TABLE `provisionar_pgto`
  ADD PRIMARY KEY (`pp_id`);

--
-- Índices de tabela `provisionar_pgto_compartilhado`
--
ALTER TABLE `provisionar_pgto_compartilhado`
  ADD PRIMARY KEY (`ppc_id`);

--
-- Índices de tabela `quest_socio_economico`
--
ALTER TABLE `quest_socio_economico`
  ADD PRIMARY KEY (`qse_id`);

--
-- Índices de tabela `reinvidicar_contrato`
--
ALTER TABLE `reinvidicar_contrato`
  ADD PRIMARY KEY (`rc_id`);

--
-- Índices de tabela `rel_comport`
--
ALTER TABLE `rel_comport`
  ADD PRIMARY KEY (`rc_id`);

--
-- Índices de tabela `requerimento`
--
ALTER TABLE `requerimento`
  ADD PRIMARY KEY (`req_id`);

--
-- Índices de tabela `requerimento_cursos`
--
ALTER TABLE `requerimento_cursos`
  ADD PRIMARY KEY (`reqc_id`);

--
-- Índices de tabela `requerimento_feedback`
--
ALTER TABLE `requerimento_feedback`
  ADD PRIMARY KEY (`rf_id`);

--
-- Índices de tabela `salario_tipos`
--
ALTER TABLE `salario_tipos`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `selecao_publica`
--
ALTER TABLE `selecao_publica`
  ADD PRIMARY KEY (`sp_id`);

--
-- Índices de tabela `selecao_publica_docs`
--
ALTER TABLE `selecao_publica_docs`
  ADD PRIMARY KEY (`spd_id`);

--
-- Índices de tabela `selecao_publica_inscritos`
--
ALTER TABLE `selecao_publica_inscritos`
  ADD PRIMARY KEY (`spi_id`);

--
-- Índices de tabela `selecao_publica_inscritos_PS2`
--
ALTER TABLE `selecao_publica_inscritos_PS2`
  ADD PRIMARY KEY (`spi_id`);

--
-- Índices de tabela `selecao_publica_inscritos_PS3`
--
ALTER TABLE `selecao_publica_inscritos_PS3`
  ADD PRIMARY KEY (`spi_id`);

--
-- Índices de tabela `selecao_publica_notas_2026_1`
--
ALTER TABLE `selecao_publica_notas_2026_1`
  ADD PRIMARY KEY (`spi_id`);

--
-- Índices de tabela `selecao_publica_processos`
--
ALTER TABLE `selecao_publica_processos`
  ADD PRIMARY KEY (`spp_id`);

--
-- Índices de tabela `servicos_contratados_emp`
--
ALTER TABLE `servicos_contratados_emp`
  ADD PRIMARY KEY (`sce_id`);

--
-- Índices de tabela `sexo`
--
ALTER TABLE `sexo`
  ADD PRIMARY KEY (`sexo_id`);

--
-- Índices de tabela `status_aluno`
--
ALTER TABLE `status_aluno`
  ADD PRIMARY KEY (`stt_id`);

--
-- Índices de tabela `status_curso`
--
ALTER TABLE `status_curso`
  ADD PRIMARY KEY (`stt_id`);

--
-- Índices de tabela `status_frequencia`
--
ALTER TABLE `status_frequencia`
  ADD PRIMARY KEY (`stt_pf_id`);

--
-- Índices de tabela `status_frequencia_horario`
--
ALTER TABLE `status_frequencia_horario`
  ADD PRIMARY KEY (`stt_freq_hor_id`);

--
-- Índices de tabela `status_mensalidade`
--
ALTER TABLE `status_mensalidade`
  ADD PRIMARY KEY (`stt_mens_id`);

--
-- Índices de tabela `status_requerimento`
--
ALTER TABLE `status_requerimento`
  ADD PRIMARY KEY (`stt_req_id`);

--
-- Índices de tabela `tabela_preco_cursos`
--
ALTER TABLE `tabela_preco_cursos`
  ADD PRIMARY KEY (`tpc_id`);

--
-- Índices de tabela `tetra_atividades`
--
ALTER TABLE `tetra_atividades`
  ADD PRIMARY KEY (`tp_id`);

--
-- Índices de tabela `tetra_respostas`
--
ALTER TABLE `tetra_respostas`
  ADD PRIMARY KEY (`tr_id`);

--
-- Índices de tabela `uf`
--
ALTER TABLE `uf`
  ADD PRIMARY KEY (`uf_id`);

--
-- Índices de tabela `unidades_proativa`
--
ALTER TABLE `unidades_proativa`
  ADD PRIMARY KEY (`up_id`);

--
-- Índices de tabela `user_sistema`
--
ALTER TABLE `user_sistema`
  ADD PRIMARY KEY (`usu_id`);

--
-- Índices de tabela `vaga_comentario_vaga`
--
ALTER TABLE `vaga_comentario_vaga`
  ADD PRIMARY KEY (`vcv_id`);

--
-- Índices de tabela `vaga_site`
--
ALTER TABLE `vaga_site`
  ADD PRIMARY KEY (`vs_id`);

--
-- Índices de tabela `vaga_site_atendimentos`
--
ALTER TABLE `vaga_site_atendimentos`
  ADD PRIMARY KEY (`vsa_id`);

--
-- Índices de tabela `vaga_site_candidatos_participantes`
--
ALTER TABLE `vaga_site_candidatos_participantes`
  ADD PRIMARY KEY (`vscp_id`);

--
-- Índices de tabela `validadar_empresas`
--
ALTER TABLE `validadar_empresas`
  ADD PRIMARY KEY (`valid_emp_id`),
  ADD UNIQUE KEY `id_empresa` (`key_id_empresa`);

--
-- Índices de tabela `validar_disciplinas`
--
ALTER TABLE `validar_disciplinas`
  ADD PRIMARY KEY (`valid_disc_id`);

--
-- Índices de tabela `visita_serv_social_emp`
--
ALTER TABLE `visita_serv_social_emp`
  ADD PRIMARY KEY (`vsse_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `alunos`
--
ALTER TABLE `alunos`
  MODIFY `alu_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `alunos_pre_cad_periodo`
--
ALTER TABLE `alunos_pre_cad_periodo`
  MODIFY `apcp_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `alunos_pre_cad_turno`
--
ALTER TABLE `alunos_pre_cad_turno`
  MODIFY `apct_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `analisa_doc`
--
ALTER TABLE `analisa_doc`
  MODIFY `ad_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `anexos_docs_cursos`
--
ALTER TABLE `anexos_docs_cursos`
  MODIFY `adc_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `anexos_docs_ie`
--
ALTER TABLE `anexos_docs_ie`
  MODIFY `adie_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `ano`
--
ALTER TABLE `ano`
  MODIFY `id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `atendimento`
--
ALTER TABLE `atendimento`
  MODIFY `atd_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `atendimento_emp`
--
ALTER TABLE `atendimento_emp`
  MODIFY `atd_emp_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `atendimento_ie`
--
ALTER TABLE `atendimento_ie`
  MODIFY `atd_ie_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `atendimento_notifica_emp`
--
ALTER TABLE `atendimento_notifica_emp`
  MODIFY `ane_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `atendimento_setor`
--
ALTER TABLE `atendimento_setor`
  MODIFY `atd_str_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `aviso_falta_aluno`
--
ALTER TABLE `aviso_falta_aluno`
  MODIFY `afa_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `bancos`
--
ALTER TABLE `bancos`
  MODIFY `id` int(5) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `banco_pix`
--
ALTER TABLE `banco_pix`
  MODIFY `p_id` int(2) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `banco_tipo_contas`
--
ALTER TABLE `banco_tipo_contas`
  MODIFY `bt_id` int(2) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `boletos_alunos`
--
ALTER TABLE `boletos_alunos`
  MODIFY `ba_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `boletos_nfs_empresas`
--
ALTER TABLE `boletos_nfs_empresas`
  MODIFY `bn_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `cad_aluno_ead`
--
ALTER TABLE `cad_aluno_ead`
  MODIFY `cad_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `calendario_10_porcento`
--
ALTER TABLE `calendario_10_porcento`
  MODIFY `c10p_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `candidato_habilidade`
--
ALTER TABLE `candidato_habilidade`
  MODIFY `ch_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `candidato_tipo_vaga`
--
ALTER TABLE `candidato_tipo_vaga`
  MODIFY `ctv_id` int(2) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `certidoes_appa`
--
ALTER TABLE `certidoes_appa`
  MODIFY `cert_id` int(5) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `certidoes_tipos`
--
ALTER TABLE `certidoes_tipos`
  MODIFY `cert_tipo_id` int(5) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `chamado`
--
ALTER TABLE `chamado`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `chamado_interacoes`
--
ALTER TABLE `chamado_interacoes`
  MODIFY `ci_id_controle` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `conhecimento_informatica`
--
ALTER TABLE `conhecimento_informatica`
  MODIFY `conh_inf_id` int(5) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `contrato_aluno`
--
ALTER TABLE `contrato_aluno`
  MODIFY `ctt_alu_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `contrato_aluno_aditivo`
--
ALTER TABLE `contrato_aluno_aditivo`
  MODIFY `caa_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `contrato_aluno_reducao_ch`
--
ALTER TABLE `contrato_aluno_reducao_ch`
  MODIFY `carch_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `contrato_aluno_tst`
--
ALTER TABLE `contrato_aluno_tst`
  MODIFY `ctt_alu_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `contrato_empresa`
--
ALTER TABLE `contrato_empresa`
  MODIFY `cte_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `contrato_motivo_canc`
--
ALTER TABLE `contrato_motivo_canc`
  MODIFY `cmc_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `contrato_motivo_susp`
--
ALTER TABLE `contrato_motivo_susp`
  MODIFY `cms_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `cron_status`
--
ALTER TABLE `cron_status`
  MODIFY `cs_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `curso`
--
ALTER TABLE `curso`
  MODIFY `curso_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `curso_appa`
--
ALTER TABLE `curso_appa`
  MODIFY `curappa_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `curso_appa_cbo`
--
ALTER TABLE `curso_appa_cbo`
  MODIFY `cac_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `curso_dias_aulas`
--
ALTER TABLE `curso_dias_aulas`
  MODIFY `cda_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `curso_dia_hora_aula`
--
ALTER TABLE `curso_dia_hora_aula`
  MODIFY `cda_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `curso_dia_retorno`
--
ALTER TABLE `curso_dia_retorno`
  MODIFY `cdr_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `curso_horarios`
--
ALTER TABLE `curso_horarios`
  MODIFY `ch_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `curso_segmento`
--
ALTER TABLE `curso_segmento`
  MODIFY `seg_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `dados_ava_covid19`
--
ALTER TABLE `dados_ava_covid19`
  MODIFY `dac_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `data_aula`
--
ALTER TABLE `data_aula`
  MODIFY `da_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `debito_carta_cob`
--
ALTER TABLE `debito_carta_cob`
  MODIFY `dcc_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `debito_notif_extra_judicial`
--
ALTER TABLE `debito_notif_extra_judicial`
  MODIFY `dnej_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `demandas_email`
--
ALTER TABLE `demandas_email`
  MODIFY `de_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `demandas_tarefas`
--
ALTER TABLE `demandas_tarefas`
  MODIFY `dt_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `demandas_tipo`
--
ALTER TABLE `demandas_tipo`
  MODIFY `dt_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `diario_visitas`
--
ALTER TABLE `diario_visitas`
  MODIFY `dv_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `dia_aula_preparatorio`
--
ALTER TABLE `dia_aula_preparatorio`
  MODIFY `dap_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `dia_retorno_aula_apdz`
--
ALTER TABLE `dia_retorno_aula_apdz`
  MODIFY `ret_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `disciplinas`
--
ALTER TABLE `disciplinas`
  MODIFY `disc_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `disciplinas_vinculos_prof`
--
ALTER TABLE `disciplinas_vinculos_prof`
  MODIFY `dvp_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `disponibilidade_horario`
--
ALTER TABLE `disponibilidade_horario`
  MODIFY `disp_hor_id` int(5) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `empresas`
--
ALTER TABLE `empresas`
  MODIFY `emp_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `empresas_agrupadas`
--
ALTER TABLE `empresas_agrupadas`
  MODIFY `ea_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `empresas_aviso_boleto`
--
ALTER TABLE `empresas_aviso_boleto`
  MODIFY `id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `empresas_grupo`
--
ALTER TABLE `empresas_grupo`
  MODIFY `eg_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `empresas_tst`
--
ALTER TABLE `empresas_tst`
  MODIFY `emp_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `envia_email_ead`
--
ALTER TABLE `envia_email_ead`
  MODIFY `ead_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `escolaridade`
--
ALTER TABLE `escolaridade`
  MODIFY `escol_id` int(5) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `estado_civil`
--
ALTER TABLE `estado_civil`
  MODIFY `ec_id` int(2) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `estagio_atividades`
--
ALTER TABLE `estagio_atividades`
  MODIFY `ea_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `estagio_atividades_31_10_2026`
--
ALTER TABLE `estagio_atividades_31_10_2026`
  MODIFY `ea_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `estagio_cursos`
--
ALTER TABLE `estagio_cursos`
  MODIFY `ec_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `estagio_estudante_vinculado`
--
ALTER TABLE `estagio_estudante_vinculado`
  MODIFY `eev_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `estagio_ra`
--
ALTER TABLE `estagio_ra`
  MODIFY `etra_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `estagio_recesso`
--
ALTER TABLE `estagio_recesso`
  MODIFY `re_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `estagio_seguradora`
--
ALTER TABLE `estagio_seguradora`
  MODIFY `id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `estagio_supervisores`
--
ALTER TABLE `estagio_supervisores`
  MODIFY `es_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `estagio_tre`
--
ALTER TABLE `estagio_tre`
  MODIFY `etre_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `excluir_dados_bd`
--
ALTER TABLE `excluir_dados_bd`
  MODIFY `ed_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `facilitador`
--
ALTER TABLE `facilitador`
  MODIFY `f_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `facilitador_turma`
--
ALTER TABLE `facilitador_turma`
  MODIFY `ft_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `feriados`
--
ALTER TABLE `feriados`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID único do feriado';

--
-- AUTO_INCREMENT de tabela `finan_banco`
--
ALTER TABLE `finan_banco`
  MODIFY `fb_id` int(4) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `finan_extrato`
--
ALTER TABLE `finan_extrato`
  MODIFY `e_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `finan_tipo_despesa`
--
ALTER TABLE `finan_tipo_despesa`
  MODIFY `td_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `finan_tipo_despesa_sub`
--
ALTER TABLE `finan_tipo_despesa_sub`
  MODIFY `tds_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `finan_tipo_receita`
--
ALTER TABLE `finan_tipo_receita`
  MODIFY `tr_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `folha_pgto_emp`
--
ALTER TABLE `folha_pgto_emp`
  MODIFY `fpe_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `frase_motivacional_cob_emp`
--
ALTER TABLE `frase_motivacional_cob_emp`
  MODIFY `fm_id` int(9) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `frequencia`
--
ALTER TABLE `frequencia`
  MODIFY `pf_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `frequencia_aluno`
--
ALTER TABLE `frequencia_aluno`
  MODIFY `id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `frequencia_master`
--
ALTER TABLE `frequencia_master`
  MODIFY `freq_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `frequencia_master_arquivo_morto`
--
ALTER TABLE `frequencia_master_arquivo_morto`
  MODIFY `freq_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `historico_acessos`
--
ALTER TABLE `historico_acessos`
  MODIFY `ace_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `historico_acessos_alu`
--
ALTER TABLE `historico_acessos_alu`
  MODIFY `ace_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `historico_acessos_emp`
--
ALTER TABLE `historico_acessos_emp`
  MODIFY `ace_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `historico_pgto_contrato`
--
ALTER TABLE `historico_pgto_contrato`
  MODIFY `id` int(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `historico_pgto_empresas`
--
ALTER TABLE `historico_pgto_empresas`
  MODIFY `hpe_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `instituicao_ensino`
--
ALTER TABLE `instituicao_ensino`
  MODIFY `ie_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `instituicao_ensino_curso`
--
ALTER TABLE `instituicao_ensino_curso`
  MODIFY `iec_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `instituicao_ensino_curso_base`
--
ALTER TABLE `instituicao_ensino_curso_base`
  MODIFY `iecb_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `instituicao_ensino_nivel`
--
ALTER TABLE `instituicao_ensino_nivel`
  MODIFY `ien_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `instituicao_ensino_resp_estagio`
--
ALTER TABLE `instituicao_ensino_resp_estagio`
  MODIFY `iere_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `instituicao_periodo`
--
ALTER TABLE `instituicao_periodo`
  MODIFY `iep_id` int(1) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `jornada_estagio`
--
ALTER TABLE `jornada_estagio`
  MODIFY `je_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `jornada_trab_pratica`
--
ALTER TABLE `jornada_trab_pratica`
  MODIFY `jtp_id` int(5) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `jornada_trab_teorica`
--
ALTER TABLE `jornada_trab_teorica`
  MODIFY `jtt_id` int(5) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `justificar_falta`
--
ALTER TABLE `justificar_falta`
  MODIFY `jf_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `justifica_frequencia`
--
ALTER TABLE `justifica_frequencia`
  MODIFY `just_freq_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `material_didatico`
--
ALTER TABLE `material_didatico`
  MODIFY `md_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `md_aluno_curso`
--
ALTER TABLE `md_aluno_curso`
  MODIFY `md_ac_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `mensagens_enviadas`
--
ALTER TABLE `mensagens_enviadas`
  MODIFY `me_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `mensagens_modelo`
--
ALTER TABLE `mensagens_modelo`
  MODIFY `mm_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `mesalidade`
--
ALTER TABLE `mesalidade`
  MODIFY `mens_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `modalidade_curso`
--
ALTER TABLE `modalidade_curso`
  MODIFY `mod_c_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `modalidade_empresa`
--
ALTER TABLE `modalidade_empresa`
  MODIFY `mod_emp_id` int(5) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `montar_turma`
--
ALTER TABLE `montar_turma`
  MODIFY `freq_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `montar_turma_base_teste`
--
ALTER TABLE `montar_turma_base_teste`
  MODIFY `freq_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `montar_turma_tst`
--
ALTER TABLE `montar_turma_tst`
  MODIFY `freq_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `nivel_educacional`
--
ALTER TABLE `nivel_educacional`
  MODIFY `ne_id` int(3) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `notas`
--
ALTER TABLE `notas`
  MODIFY `nota_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `notifica_aluno`
--
ALTER TABLE `notifica_aluno`
  MODIFY `na_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `notifica_aviso_ferias_apz`
--
ALTER TABLE `notifica_aviso_ferias_apz`
  MODIFY `nafa_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `notifica_ctt_nep_ser_estacio`
--
ALTER TABLE `notifica_ctt_nep_ser_estacio`
  MODIFY `id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `notifica_fim_contrato`
--
ALTER TABLE `notifica_fim_contrato`
  MODIFY `nfc_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `notifica_seguro_estagio`
--
ALTER TABLE `notifica_seguro_estagio`
  MODIFY `nse_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `operadora_telefone`
--
ALTER TABLE `operadora_telefone`
  MODIFY `op_id` int(5) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `origem_cpf`
--
ALTER TABLE `origem_cpf`
  MODIFY `orig_cpf_id` int(5) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `provisionar_pgto`
--
ALTER TABLE `provisionar_pgto`
  MODIFY `pp_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `provisionar_pgto_compartilhado`
--
ALTER TABLE `provisionar_pgto_compartilhado`
  MODIFY `ppc_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `quest_socio_economico`
--
ALTER TABLE `quest_socio_economico`
  MODIFY `qse_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `reinvidicar_contrato`
--
ALTER TABLE `reinvidicar_contrato`
  MODIFY `rc_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `rel_comport`
--
ALTER TABLE `rel_comport`
  MODIFY `rc_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `requerimento`
--
ALTER TABLE `requerimento`
  MODIFY `req_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `requerimento_cursos`
--
ALTER TABLE `requerimento_cursos`
  MODIFY `reqc_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `requerimento_feedback`
--
ALTER TABLE `requerimento_feedback`
  MODIFY `rf_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `salario_tipos`
--
ALTER TABLE `salario_tipos`
  MODIFY `id` int(2) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `selecao_publica`
--
ALTER TABLE `selecao_publica`
  MODIFY `sp_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `selecao_publica_docs`
--
ALTER TABLE `selecao_publica_docs`
  MODIFY `spd_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `selecao_publica_inscritos`
--
ALTER TABLE `selecao_publica_inscritos`
  MODIFY `spi_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `selecao_publica_inscritos_PS2`
--
ALTER TABLE `selecao_publica_inscritos_PS2`
  MODIFY `spi_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `selecao_publica_inscritos_PS3`
--
ALTER TABLE `selecao_publica_inscritos_PS3`
  MODIFY `spi_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `selecao_publica_notas_2026_1`
--
ALTER TABLE `selecao_publica_notas_2026_1`
  MODIFY `spi_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `selecao_publica_processos`
--
ALTER TABLE `selecao_publica_processos`
  MODIFY `spp_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `servicos_contratados_emp`
--
ALTER TABLE `servicos_contratados_emp`
  MODIFY `sce_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `sexo`
--
ALTER TABLE `sexo`
  MODIFY `sexo_id` int(5) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `status_aluno`
--
ALTER TABLE `status_aluno`
  MODIFY `stt_id` int(2) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `status_curso`
--
ALTER TABLE `status_curso`
  MODIFY `stt_id` int(2) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `status_frequencia`
--
ALTER TABLE `status_frequencia`
  MODIFY `stt_pf_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `status_frequencia_horario`
--
ALTER TABLE `status_frequencia_horario`
  MODIFY `stt_freq_hor_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `status_mensalidade`
--
ALTER TABLE `status_mensalidade`
  MODIFY `stt_mens_id` int(5) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `status_requerimento`
--
ALTER TABLE `status_requerimento`
  MODIFY `stt_req_id` int(2) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `tabela_preco_cursos`
--
ALTER TABLE `tabela_preco_cursos`
  MODIFY `tpc_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `tetra_atividades`
--
ALTER TABLE `tetra_atividades`
  MODIFY `tp_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `tetra_respostas`
--
ALTER TABLE `tetra_respostas`
  MODIFY `tr_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `uf`
--
ALTER TABLE `uf`
  MODIFY `uf_id` int(2) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `unidades_proativa`
--
ALTER TABLE `unidades_proativa`
  MODIFY `up_id` int(5) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `user_sistema`
--
ALTER TABLE `user_sistema`
  MODIFY `usu_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `vaga_comentario_vaga`
--
ALTER TABLE `vaga_comentario_vaga`
  MODIFY `vcv_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `vaga_site`
--
ALTER TABLE `vaga_site`
  MODIFY `vs_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `vaga_site_atendimentos`
--
ALTER TABLE `vaga_site_atendimentos`
  MODIFY `vsa_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `vaga_site_candidatos_participantes`
--
ALTER TABLE `vaga_site_candidatos_participantes`
  MODIFY `vscp_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `validadar_empresas`
--
ALTER TABLE `validadar_empresas`
  MODIFY `valid_emp_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `validar_disciplinas`
--
ALTER TABLE `validar_disciplinas`
  MODIFY `valid_disc_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `visita_serv_social_emp`
--
ALTER TABLE `visita_serv_social_emp`
  MODIFY `vsse_id` int(10) NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------

--
-- Estrutura para view `vw_meses`
--
DROP TABLE IF EXISTS `vw_meses`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_meses`  AS SELECT 1 AS `mes`union all select 2 AS `2` union all select 3 AS `3` union all select 4 AS `4` union all select 5 AS `5` union all select 6 AS `6` union all select 7 AS `7` union all select 8 AS `8` union all select 9 AS `9` union all select 10 AS `10` union all select 11 AS `11` union all select 12 AS `12`  ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
