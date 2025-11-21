// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DrugRegistry
 * @notice Gas-optimized pharmaceutical provenance tracking with AI oracle integration
 * @dev Stores drug batch hashes with minimal on-chain footprint
 */
contract DrugRegistry {
    
    // ==================== EVENTS ====================
    
    event DrugRegistered(
        bytes32 indexed batchHash,
        address indexed issuer,
        uint256 timestamp,
        string batchId
    );
    
    event ShortageAlert(
        bytes32 indexed predictionHash,
        string drugName,
        string location,
        uint256 probability,
        uint256 timestamp
    );
    
    event DrugVerified(
        bytes32 indexed batchHash,
        address indexed verifier,
        bool isAuthentic,
        uint256 timestamp
    );
    
    event FakeDrugDetected(
        bytes32 indexed batchHash,
        address indexed reporter,
        uint256 timestamp,
        string reason
    );
    
    // ==================== STRUCTS ====================
    
    struct DrugBatch {
        bytes32 batchHash;
        address issuer;
        uint256 registrationTime;
        string batchId;
        bool isValid;
        uint256 verificationCount;
    }
    
    struct ShortagePreddiction {
        bytes32 predictionHash;
        string drugName;
        string location;
        uint256 probability; // Scaled by 1000 (e.g., 750 = 75.0%)
        uint256 timestamp;
        address oracle;
    }
    
    // ==================== STATE VARIABLES ====================
    
    mapping(bytes32 => DrugBatch) public drugBatches;
    mapping(bytes32 => ShortagePreddiction) public shortagePredictions;
    mapping(address => bool) public authorizedIssuers;
    mapping(address => bool) public authorizedOracles;
    
    address public owner;
    uint256 public totalBatchesRegistered;
    uint256 public totalVerifications;
    
    // ==================== MODIFIERS ====================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }
    
    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender], "Not authorized issuer");
        _;
    }
    
    modifier onlyAuthorizedOracle() {
        require(authorizedOracles[msg.sender], "Not authorized oracle");
        _;
    }
    
    // ==================== CONSTRUCTOR ====================
    
    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
        authorizedOracles[msg.sender] = true;
    }
    
    // ==================== ADMIN FUNCTIONS ====================
    
    function addAuthorizedIssuer(address _issuer) external onlyOwner {
        authorizedIssuers[_issuer] = true;
    }
    
    function removeAuthorizedIssuer(address _issuer) external onlyOwner {
        authorizedIssuers[_issuer] = false;
    }
    
    function addAuthorizedOracle(address _oracle) external onlyOwner {
        authorizedOracles[_oracle] = true;
    }
    
    function removeAuthorizedOracle(address _oracle) external onlyOwner {
        authorizedOracles[_oracle] = false;
    }
    
    // ==================== CORE FUNCTIONS ====================
    
    /**
     * @notice Register new drug batch on-chain
     * @param _batchHash Cryptographic hash of batch data
     * @param _batchId Human-readable batch identifier
     */
    function registerDrugBatch(
        bytes32 _batchHash,
        string calldata _batchId
    ) external onlyAuthorizedIssuer {
        require(_batchHash != bytes32(0), "Invalid hash");
        require(!drugBatches[_batchHash].isValid, "Batch already registered");
        
        drugBatches[_batchHash] = DrugBatch({
            batchHash: _batchHash,
            issuer: msg.sender,
            registrationTime: block.timestamp,
            batchId: _batchId,
            isValid: true,
            verificationCount: 0
        });
        
        totalBatchesRegistered++;
        
        emit DrugRegistered(_batchHash, msg.sender, block.timestamp, _batchId);
    }
    
    /**
     * @notice Verify drug batch authenticity
     * @param _batchHash Hash to verify
     * @return isValid Whether batch exists and is valid
     * @return batch Full batch information
     */
    function verifyDrugBatch(bytes32 _batchHash) 
        external 
        returns (bool isValid, DrugBatch memory batch) 
    {
        batch = drugBatches[_batchHash];
        isValid = batch.isValid;
        
        if (isValid) {
            drugBatches[_batchHash].verificationCount++;
            totalVerifications++;
            emit DrugVerified(_batchHash, msg.sender, true, block.timestamp);
        }
        
        return (isValid, batch);
    }
    
    /**
     * @notice Record AI shortage prediction on-chain
     * @param _predictionHash Hash of prediction data
     * @param _drugName Name of drug
     * @param _location Hospital/city location
     * @param _probability Shortage probability (0-1000)
     */
    function recordShortagePrediction(
        bytes32 _predictionHash,
        string calldata _drugName,
        string calldata _location,
        uint256 _probability
    ) external onlyAuthorizedOracle {
        require(_probability <= 1000, "Invalid probability");
        require(_predictionHash != bytes32(0), "Invalid hash");
        
        shortagePredictions[_predictionHash] = ShortagePreddiction({
            predictionHash: _predictionHash,
            drugName: _drugName,
            location: _location,
            probability: _probability,
            timestamp: block.timestamp,
            oracle: msg.sender
        });
        
        emit ShortageAlert(
            _predictionHash,
            _drugName,
            _location,
            _probability,
            block.timestamp
        );
    }
    
    /**
     * @notice Report fake drug detection
     * @param _batchHash Hash of suspicious batch
     * @param _reason Description of why drug is suspected fake
     */
    function reportFakeDrug(
        bytes32 _batchHash,
        string calldata _reason
    ) external {
        require(_batchHash != bytes32(0), "Invalid hash");
        
        // Invalidate batch
        if (drugBatches[_batchHash].isValid) {
            drugBatches[_batchHash].isValid = false;
        }
        
        emit FakeDrugDetected(_batchHash, msg.sender, block.timestamp, _reason);
    }
    
    /**
     * @notice Get drug batch information (view function)
     * @param _batchHash Hash to query
     * @return batch Batch information
     */
    function getDrugBatch(bytes32 _batchHash) 
        external 
        view 
        returns (DrugBatch memory batch) 
    {
        return drugBatches[_batchHash];
    }
    
    /**
     * @notice Get shortage prediction (view function)
     * @param _predictionHash Prediction hash to query
     * @return prediction Prediction information
     */
    function getShortagePrediction(bytes32 _predictionHash)
        external
        view
        returns (ShortagePreddiction memory prediction)
    {
        return shortagePredictions[_predictionHash];
    }
    
    /**
     * @notice Check if batch exists on-chain
     * @param _batchHash Hash to check
     * @return exists Whether batch is registered and valid
     */
    function batchExists(bytes32 _batchHash) external view returns (bool) {
        return drugBatches[_batchHash].isValid;
    }
    
    /**
     * @notice Get contract statistics
     * @return stats Array of [totalBatches, totalVerifications, blockNumber]
     */
    function getStats() external view returns (uint256[3] memory stats) {
        stats[0] = totalBatchesRegistered;
        stats[1] = totalVerifications;
        stats[2] = block.number;
        return stats;
    }
}
